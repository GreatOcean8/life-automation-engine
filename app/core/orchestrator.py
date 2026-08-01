"""
Master Orchestrator Engine.
Implements the Unified Master Task System, Multi-Agent Coordination,
Background Triggers, and Visual Graph State Tracking.
"""

import os
import uuid
import logging
from typing import Dict, List, Optional
from app.core.agent_base import BaseOOAgent, agentic_action
from app.domain.models import Task, TaskStatus, TaskPriority, AssigneeType, AgentNode, AgentStatus
from app.domain.models import (
    Task, TaskStatus, TaskPriority, AssigneeType, AuditLogEntry, AgentNode, AgentStatus
)
from app.subagents.email_triage import EmailTriageSubagent, EmailMessage
from app.subagents.real_estate import RealEstateSubagent, PropertyListing
from app.subagents.job_scanner import JobScannerSubagent, JobPosting
from app.subagents.expense_tracker import ExpenseSubagent
from app.skills_engine.loader import SkillsEngine

from app.storage.db import (
    save_tasks_to_disk, load_tasks_from_disk, 
    save_audit_logs_to_disk, load_audit_logs_from_disk
)

logger = logging.getLogger(__name__)


class MasterOrchestrator(BaseOOAgent):
    """
    Master Orchestrator Agent.
    Coordinates human & agent tasks in the Unified Master Task System,
    spawns subagents, handles HITL approvals, and manages real-time graph nodes.
    """

    def __init__(self, skills_dir: str = "skills"):
        super().__init__(
            node_id="master_orchestrator",
            name="Master Orchestrator Agent",
            agent_type="Orchestrator"
        )

        self.subagents: Dict[str, BaseOOAgent] = {}
        self.audit_logs: List[AuditLogEntry] = load_audit_logs_from_disk()

        # Subagent instances
        self.email_agent = EmailTriageSubagent()
        self.real_estate_agent = RealEstateSubagent()
        self.job_agent = JobScannerSubagent()
        self.expense_agent = ExpenseSubagent()

        # Register subagents dynamically
        self.register_subagent(self.email_agent)
        self.register_subagent(self.real_estate_agent)
        self.register_subagent(self.job_agent)
        self.register_subagent(self.expense_agent)

        # Skills Engine
        self.skills_engine = SkillsEngine(skills_dir=skills_dir)

        # Restore persisted state from disk
        restored = load_tasks_from_disk()
        if restored is not None:
            self.tasks = restored
        else:
            self.tasks: Dict[str, Task] = {}
            self._seed_initial_tasks()
        
        # Seed audit entries for existing tasks if audit_logs is empty
        if not self.audit_logs:
            for task in self.tasks.values():
                entry = AuditLogEntry(
                    id=f"audit_{uuid.uuid4().hex[:8]}",
                    action_type="TASK_CREATED",
                    author=task.creator,
                    details=f"Task '{task.title}' initialized in system",
                    target_id=task.task_id,
                    new_state=task.model_dump()
                )
                self.audit_logs.append(entry)
            save_audit_logs_to_disk(self.audit_logs)

    def register_subagent(self, subagent: BaseOOAgent):
        """Registers a subagent instance dynamically in the Orchestrator."""
        self.subagents[subagent.node.node_id] = subagent
        self.log(f"Registered subagent: '{subagent.node.name}' ({subagent.node.node_id})")

    def on_state_changed(self):
        """Interceptor callback invoked automatically by @agentic_action."""
        save_tasks_to_disk(self.tasks)
        save_audit_logs_to_disk(self.audit_logs)


    def _seed_initial_tasks(self):
        sample_tasks = [
            Task(
                task_id="task_1",
                title="Call dentist to reschedule appointment",
                description="Reschedule for next Thursday afternoon.",
                assignee_type=AssigneeType.HUMAN,
                assignee_id="human_user",
                creator="human_user",
                status=TaskStatus.TODO,
                priority=TaskPriority.MEDIUM
            ),
            Task(
                task_id="task_2",
                title="Review Q3 Investment Strategy",
                description="Check portfolio allocation and cash reserves.",
                assignee_type=AssigneeType.HUMAN,
                assignee_id="human_user",
                creator="human_user",
                status=TaskStatus.TODO,
                priority=TaskPriority.HIGH
            )
        ]
        for t in sample_tasks:
            self.tasks[t.task_id] = t

    def get_all_tasks(self) -> List[Task]:
        return list(self.tasks.values())

    def get_task(self, task_id: str) -> Optional[Task]:
        return self.tasks.get(task_id)

    @agentic_action(description="Creates a new task assigned to a human user")
    def create_human_task(self, title: str, description: str = "", priority: TaskPriority = TaskPriority.MEDIUM) -> Task:
        task = Task(
            task_id=f"task_{uuid.uuid4().hex[:8]}",
            title=title,
            description=description,
            priority=priority,
            assignee_type=AssigneeType.HUMAN,
            assignee_id="human_user",
            creator="human_user",
            status=TaskStatus.TODO
        )
        self.tasks[task.task_id] = task
        self.log(f"Human Task Created: {title}")
        self.log_audit(
            action_type="TASK_CREATED",
            author="Human",
            details=f"Created task '{title}'",
            target_id=task.task_id,
            new_state=task.model_dump()
        )
        return task

    def get_graph_nodes(self) -> List[AgentNode]:
        """Returns visual graph topology nodes for real-time UI inspection."""
        active_sub_names = [agent.node.name for agent in self.subagents.values() if agent.node.status != AgentStatus.IDLE]
        self.node.active_subagents = active_sub_names
        self.sync_node_state()
        
        nodes = [self.node]
        for sub in self.subagents.values():
            sub.sync_node_state()
            nodes.append(sub.node)
        return nodes

    @agentic_action(description="Delegates a Task from Human to a specific Subagent")
    def delegate_task_to_agent(self, task_id: str, target_subagent_id: str) -> Optional[Task]:
        task = self.tasks.get(task_id)
        if not task:
            logger.error(f"Task {task_id} not found.")
            return None

        subagent = self.subagents.get(target_subagent_id)
        if not subagent:
            logger.error(f"Subagent {target_subagent_id} not found.")
            return None

        task.assignee_type = AssigneeType.AGENT
        task.assignee_id = target_subagent_id
        task.status = TaskStatus.RUNNING
        task.add_log("MasterOrchestrator", f"Delegated task to {subagent.node.name}.")

        self.set_status(AgentStatus.RUNNING, active_step=f"Delegated {task.title} to {subagent.node.name}")
        self.log(f"Delegating Task '{task.title}' -> {subagent.node.name}")

        # Execute subagent delegation handler dynamically
        subagent.set_status(AgentStatus.RUNNING, active_step=f"Executing delegated task: {task.title}")
        result_task = subagent.handle_delegated_task(task)
        self.tasks[result_task.task_id] = result_task

        subagent.set_status(AgentStatus.IDLE, active_step="Idle")
        self.set_status(AgentStatus.IDLE, active_step="Idle")
        return result_task


    @agentic_action(description="Approves a pending HITL task (e.g. Bill Payment)")
    def approve_task(self, task_id: str) -> Optional[Task]:
        task = self.tasks.get(task_id)
        if not task or task.status != TaskStatus.WAITING_FOR_APPROVAL:
            return None

        task.status = TaskStatus.DONE
        task.add_log("Human", "Approved HITL action (e.g. Bill Payment Executed).")
        self.log(f"Human Approved Task: {task.title}")
        return task

    def log_audit(self, action_type: str, author: str, details: str, target_id: str, previous_state: Optional[Dict[str, Any]] = None, new_state: Optional[Dict[str, Any]] = None):
        """Records an immutable audit event for change tracking and undo capability."""
        entry = AuditLogEntry(
            id=f"audit_{uuid.uuid4().hex[:8]}",
            action_type=action_type,
            author=author,
            details=details,
            target_id=target_id,
            previous_state=previous_state,
            new_state=new_state
        )
        self.audit_logs.insert(0, entry)
        if len(self.audit_logs) > 100:
            self.audit_logs = self.audit_logs[:100]

    @agentic_action(description="Updates an existing task's title, description, priority, or status")
    def update_task(self, task_id: str, title: Optional[str] = None, description: Optional[str] = None, priority: Optional[TaskPriority] = None, status: Optional[TaskStatus] = None) -> Optional[Task]:
        task = self.tasks.get(task_id)
        if not task:
            return None

        prev_state = task.model_dump()
        if title is not None:
            task.title = title
        if description is not None:
            task.description = description
        if priority is not None:
            task.priority = priority
        if status is not None:
            task.status = status

        task.add_log("Human", "Updated task details.")
        self.log(f"Human Updated Task: {task.title}")
        self.log_audit(
            action_type="TASK_UPDATED",
            author="Human",
            details=f"Updated details for '{task.title}'",
            target_id=task.task_id,
            previous_state=prev_state,
            new_state=task.model_dump()
        )
        return task

    @agentic_action(description="Soft-deletes a task (moves to Archive for revert capability)")
    def delete_task(self, task_id: str) -> bool:
        task = self.tasks.get(task_id)
        if not task:
            return False

        prev_state = task.model_dump()
        task.is_archived = True
        task.status = TaskStatus.CANCELLED
        task.add_log("Human", "Moved task to Archive.")
        self.log(f"Human Soft-Deleted Task: {task.title}")
        
        self.log_audit(
            action_type="TASK_DELETED",
            author="Human",
            details=f"Archived task '{task.title}'",
            target_id=task.task_id,
            previous_state=prev_state,
            new_state=task.model_dump()
        )
        return True

    def get_audit_logs_with_stack(self) -> List[AuditLogEntry]:
        """
        Returns audit logs with LIFO sequential revert eligibility computed.
        Only TASK_DELETED and SKILL_UPDATED actions are revertable operations.
        For any target, ONLY the most recent non-reverted change can be reverted.
        """
        seen_targets = set()
        for entry in self.audit_logs:
            entry.can_revert = False
            if entry.action_type in ("TASK_DELETED", "SKILL_UPDATED") and not entry.is_reverted and entry.previous_state is not None:
                if entry.target_id not in seen_targets:
                    entry.can_revert = True
                    seen_targets.add(entry.target_id)
        return self.audit_logs


    def mark_audit_reverted(self, target_id: str, action_types: List[str]):
        """Marks the most recent active audit entry for target_id as reverted."""
        for entry in self.audit_logs:
            if entry.target_id == target_id and entry.action_type in action_types and not entry.is_reverted:
                entry.is_reverted = True
                entry.can_revert = False
                break
        save_audit_logs_to_disk(self.audit_logs)

    @agentic_action(description="Restores/Reverts a deleted or archived task back to TODO list")
    def restore_task(self, task_id: str) -> Optional[Task]:
        task = self.tasks.get(task_id)
        if not task or not task.is_archived:
            return None

        prev_state = task.model_dump()
        task.is_archived = False
        task.status = TaskStatus.TODO
        task.add_log("Human", "Restored task from Archive.")
        self.log(f"Human Restored Task: {task.title}")

        self.mark_audit_reverted(task_id, ["TASK_DELETED"])

        self.log_audit(
            action_type="TASK_RESTORED",
            author="Human",
            details=f"Restored task '{task.title}' to TODO board",
            target_id=task.task_id,
            previous_state=prev_state,
            new_state=task.model_dump()
        )
        return task



    @agentic_action(description="Triggers periodic Email & Bill Triage audit")
    def run_email_triage_trigger(self) -> List[Task]:
        """Triggered periodically to scan inbox."""
        self.log("Running periodic Email & Bill Triage trigger...")
        sample_emails = [
            EmailMessage(id="e101", sender="billing@utilitycompany.com", subject="Electric Bill - Action Required", body="Your bill of $142.50 is due Friday.", amount=142.50, due_date="2026-08-05"),
            EmailMessage(id="e102", sender="notifications@watercorp.com", subject="Monthly Water Bill Statement", body="Amount due $45.00.", amount=45.00, due_date="2026-08-10")
        ]
        created_tasks = []
        for email in sample_emails:
            t = self.email_agent.process_email(email)
            self.tasks[t.task_id] = t
            created_tasks.append(t)
        return created_tasks

    @agentic_action(description="Triggers periodic Real Estate and Job Market scan")
    def run_market_scan_trigger(self) -> List[Task]:
        """Triggered periodically to scan Real Estate and Jobs."""
        self.log("Running periodic Real Estate & Job Market trigger...")
        sample_properties = [
            PropertyListing(listing_id="re1", address="1402 South Congress Ave", zip_code="78704", price=820000.0, sqft=2100, bedrooms=3, bathrooms=2.5, monthly_rent_estimate=5200.0, hoa_fee=150.0),
            PropertyListing(listing_id="re2", address="8901 Ranch Rd", zip_code="78746", price=950000.0, sqft=3000, bedrooms=4, bathrooms=3.0, monthly_rent_estimate=4800.0)
        ]
        sample_jobs = [
            JobPosting(job_id="j1", title="Senior AI Agent Architect", company="Anthropic", location="Austin, TX", is_remote=True, salary_min=180000.0, salary_max=240000.0, skills_required=["AI", "Python", "Agent", "Architect"]),
        ]

        created_tasks = []
        for prop in sample_properties:
            t = self.real_estate_agent.evaluate_listing(prop)
            if t:
                self.tasks[t.task_id] = t
                created_tasks.append(t)

        for job in sample_jobs:
            t = self.job_agent.evaluate_job(job)
            if t:
                self.tasks[t.task_id] = t
                created_tasks.append(t)

        return created_tasks


