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
from app.subagents.email_triage import EmailTriageSubagent, EmailMessage
from app.subagents.real_estate import RealEstateSubagent, PropertyListing
from app.subagents.job_scanner import JobScannerSubagent, JobPosting
from app.subagents.expense_tracker import ExpenseSubagent
from app.skills_engine.loader import SkillsEngine

from app.storage.db import load_tasks_from_disk, save_tasks_to_disk

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

        # Subagent instances
        self.email_agent = EmailTriageSubagent()
        self.real_estate_agent = RealEstateSubagent()
        self.job_agent = JobScannerSubagent()
        self.expense_agent = ExpenseSubagent()

        # Register subagents dynamically
        for agent in [self.email_agent, self.real_estate_agent, self.job_agent, self.expense_agent]:
            self.register_subagent(agent)


        # Skills Engine
        self.skills_engine = SkillsEngine(skills_dir=skills_dir)

    def register_subagent(self, subagent: BaseOOAgent):
        """Registers a subagent instance dynamically in the Orchestrator."""
        self.subagents[subagent.node.node_id] = subagent
        self.log(f"Registered subagent: '{subagent.node.name}' ({subagent.node.node_id})")


        # Load persisted tasks from disk if available, otherwise seed defaults
        loaded = load_tasks_from_disk()
        if loaded is not None:
            self.tasks: Dict[str, Task] = loaded
        else:
            self.tasks: Dict[str, Task] = {}
            self._seed_initial_tasks()
            self.on_state_changed()

    def on_state_changed(self):
        """Automatic state persistence hook invoked whenever an action executes."""
        save_tasks_to_disk(self.tasks)

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

    @agentic_action(description="Creates a new human TODO task card")
    def create_human_task(self, title: str, description: str = "", priority: TaskPriority = TaskPriority.MEDIUM) -> Task:
        task_id = f"task_{uuid.uuid4().hex[:8]}"
        task = Task(
            task_id=task_id,
            title=title,
            description=description,
            assignee_type=AssigneeType.HUMAN,
            assignee_id="human_user",
            creator="human_user",
            status=TaskStatus.TODO,
            priority=priority
        )
        task.add_log("Human", "Created task in Master TODO list.")
        self.tasks[task_id] = task
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

    @agentic_action(description="Updates an existing task's title, description, priority, or status")
    def update_task(self, task_id: str, title: Optional[str] = None, description: Optional[str] = None, priority: Optional[TaskPriority] = None, status: Optional[TaskStatus] = None) -> Optional[Task]:
        task = self.tasks.get(task_id)
        if not task:
            return None

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
        return task

    @agentic_action(description="Deletes a task from the system completely")
    def delete_task(self, task_id: str) -> bool:
        if task_id in self.tasks:
            deleted_task = self.tasks.pop(task_id)
            self.log(f"Human Deleted Task: {deleted_task.title}")
            return True
        return False

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


