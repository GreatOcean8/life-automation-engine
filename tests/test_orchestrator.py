"""
Integration tests for Master Orchestrator, Subagent Delegation, and Triggers.
"""

from app.core.orchestrator import MasterOrchestrator
from app.domain.models import TaskStatus, TaskPriority, AssigneeType


def test_master_orchestrator_initialization():
    orchestrator = MasterOrchestrator()
    assert len(orchestrator.tasks) >= 2  # Sample tasks seeded
    assert len(orchestrator.subagents) == 4  # Email, RealEstate, Job, Expense
    assert len(orchestrator.get_graph_nodes()) == 5  # Master + 4 subagents


def test_create_human_task():
    orchestrator = MasterOrchestrator()
    task = orchestrator.create_human_task(
        title="Buy anniversary gift",
        description="Search for vintage watch.",
        priority=TaskPriority.HIGH
    )
    assert task.title == "Buy anniversary gift"
    assert task.assignee_type == AssigneeType.HUMAN
    assert task.status == TaskStatus.TODO
    assert orchestrator.get_task(task.task_id) is not None


def test_email_triage_trigger_hitl_approval():
    orchestrator = MasterOrchestrator()
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


def test_update_and_delete_task():
    orchestrator = MasterOrchestrator()
    task = orchestrator.create_human_task("Initial Title", "Initial Description")
    
    # Test Update
    updated = orchestrator.update_task(task.task_id, title="Updated Title", description="Updated Description")
    assert updated.title == "Updated Title"
    assert updated.description == "Updated Description"
    
    # Test Delete
    success = orchestrator.delete_task(task.task_id)
    assert success is True
    assert orchestrator.get_task(task.task_id) is None

