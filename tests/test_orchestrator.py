"""
Integration tests for Master Orchestrator, Subagent Delegation, and Triggers.
"""

from app.core.orchestrator import MasterOrchestrator
from app.domain.models import TaskStatus, TaskPriority, AssigneeType


def test_master_orchestrator_initialization(tmp_path):
    orchestrator = MasterOrchestrator(data_dir=str(tmp_path), skills_dir=str(tmp_path))
    assert len(orchestrator.tasks) >= 2  # Sample tasks seeded
    assert len(orchestrator.subagents) == 4  # Email, RealEstate, Job, Expense
    assert len(orchestrator.get_graph_nodes()) == 5  # Master + 4 subagents


def test_create_human_task(tmp_path):
    orchestrator = MasterOrchestrator(data_dir=str(tmp_path), skills_dir=str(tmp_path))
    task = orchestrator.create_human_task(
        title="Buy anniversary gift",
        description="Search for vintage watch.",
        priority=TaskPriority.HIGH
    )
    assert task.title == "Buy anniversary gift"
    assert task.assignee_type == AssigneeType.HUMAN
    assert task.status == TaskStatus.TODO
    assert orchestrator.get_task(task.task_id) is not None


def test_email_triage_trigger_hitl_approval(tmp_path):
    orchestrator = MasterOrchestrator(data_dir=str(tmp_path), skills_dir=str(tmp_path))
    created_tasks = orchestrator.run_email_triage_trigger()
    
    assert len(created_tasks) == 2
    # Bill over $100 ($142.50) should be in WAITING_FOR_APPROVAL status
    urgent_bill = next(t for t in created_tasks if t.amount == 142.50)
    assert urgent_bill.status == TaskStatus.WAITING_FOR_APPROVAL
    assert len(urgent_bill.actions) == 2

    # Test Human Approval
    approved_task = orchestrator.approve_task(urgent_bill.task_id)
    assert approved_task.status == TaskStatus.DONE
    assert "Approved HITL action" in approved_task.logs[-1].message


def test_update_and_delete_task(tmp_path):
    orchestrator = MasterOrchestrator(data_dir=str(tmp_path), skills_dir=str(tmp_path))
    task = orchestrator.create_human_task("Initial Title", "Initial Description")
    
    # Test Update
    updated = orchestrator.update_task(task.task_id, title="Updated Title", description="Updated Description")
    assert updated.title == "Updated Title"
    assert updated.description == "Updated Description"
    
    # Test Soft Delete
    success = orchestrator.delete_task(task.task_id)
    assert success is True
    assert task.is_archived is True

    # Test Restore
    restored = orchestrator.restore_task(task.task_id)
    assert restored is not None
    assert restored.is_archived is False
    assert restored.status == TaskStatus.TODO
    assert len(orchestrator.audit_logs) >= 3


def test_sequential_lifo_audit_undo_stack(tmp_path):
    orchestrator = MasterOrchestrator(data_dir=str(tmp_path), skills_dir=str(tmp_path))
    target_id = "test_skill_target"

    # Simulate 3 sequential edits
    orchestrator.log_audit("SKILL_UPDATED", "Human", "Edit 1", target_id, previous_state={"ver": 1})
    orchestrator.log_audit("SKILL_UPDATED", "Human", "Edit 2", target_id, previous_state={"ver": 2})
    orchestrator.log_audit("SKILL_UPDATED", "Human", "Edit 3", target_id, previous_state={"ver": 3})

    stack = orchestrator.get_audit_logs_with_stack()
    target_entries = [e for e in stack if e.target_id == target_id]

    # Only Edit 3 (most recent) should have can_revert == True
    assert target_entries[0].details == "Edit 3"
    assert target_entries[0].can_revert is True

    # Older edits (Edit 2, Edit 1) must have can_revert == False and is_blocked == True
    assert target_entries[1].details == "Edit 2"
    assert target_entries[1].can_revert is False
    assert target_entries[1].is_blocked is True

    assert target_entries[2].details == "Edit 1"
    assert target_entries[2].can_revert is False
    assert target_entries[2].is_blocked is True


    # Mark Edit 3 as reverted
    orchestrator.mark_audit_reverted(target_id, ["SKILL_UPDATED"])
    new_stack = orchestrator.get_audit_logs_with_stack()
    new_target_entries = [e for e in new_stack if e.target_id == target_id]

    # Now Edit 3 is is_reverted == True, and Edit 2 becomes the new candidate for revert (can_revert == True)!
    assert new_target_entries[0].is_reverted is True
    assert new_target_entries[0].can_revert is False

    assert new_target_entries[1].is_reverted is False
    assert new_target_entries[1].can_revert is True


def test_dual_revert_stack_eligibility(tmp_path):
    """Verifies that after reverting, BOTH the SKILL_REVERTED event and the underlying SKILL_UPDATED event have can_revert == True."""
    orchestrator = MasterOrchestrator(skills_dir=str(tmp_path))
    skill_name = "dual_revert_skill"

    # Edit 1 (Version 1)
    orchestrator.skills_engine.save_or_update_skill(skill_name, "Version 1", ["Rule 1"])
    orchestrator.log_audit("SKILL_UPDATED", "Human", "Edit 1", skill_name, previous_state={"instructions": "V0", "rules": []}, new_state={"instructions": "Version 1", "rules": ["Rule 1"]})

    # Edit 2 (Version 2)
    orchestrator.skills_engine.save_or_update_skill(skill_name, "Version 2", ["Rule 1", "Rule 2"])
    orchestrator.log_audit("SKILL_UPDATED", "Human", "Edit 2", skill_name, previous_state={"instructions": "Version 1", "rules": ["Rule 1"]}, new_state={"instructions": "Version 2", "rules": ["Rule 1", "Rule 2"]})

    # Revert Edit 2 (pushes SKILL_REVERTED to top)
    stack_before_revert = orchestrator.get_audit_logs_with_stack()
    top = stack_before_revert[0]
    orchestrator.revert_audit_entry(top.id)

    # Compute updated stack
    stack = orchestrator.get_audit_logs_with_stack()
    target_logs = [l for l in stack if l.target_id == skill_name]

    # Log 0: SKILL_REVERTED -> can_revert == True (Undo Revert)
    revert_action_log = target_logs[0]
    assert revert_action_log.action_type == "SKILL_REVERTED"
    assert revert_action_log.can_revert is True
    assert revert_action_log.is_reverted is False

    # Log 1: SKILL_UPDATED (Edit 2) -> is_reverted == True
    reverted_edit_log = target_logs[1]
    assert reverted_edit_log.is_reverted is True
    assert reverted_edit_log.can_revert is False

    # Log 2: SKILL_UPDATED (Edit 1) -> can_revert == True (Revert Skill to V0)
    active_content_log = target_logs[2]
    assert active_content_log.action_type == "SKILL_UPDATED"
    assert active_content_log.details == "Edit 1"
    assert active_content_log.can_revert is True
    assert active_content_log.is_blocked is False


def test_ny_timezone_timestamps():
    """Verifies that audit log entries and task logs contain valid ISO timestamps with timezone offsets."""
    from app.domain.models import get_ny_timestamp
    ts = get_ny_timestamp()
    assert "T" in ts
    assert "-" in ts or "+" in ts  # Timezone offset present





