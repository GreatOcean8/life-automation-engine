"""
Email & Bill Triage Subagent.
Scans inbox, flags urgent messages, calculates due dates, and creates HITL task cards for bills > $100.
"""

from typing import Dict, List, Literal, Optional
from pydantic import BaseModel, Field
from app.core.agent_base import BaseOOAgent, agentic_action
from app.domain.models import Task, TaskStatus, TaskPriority, AssigneeType, TaskAction, AgentStatus


class EmailMessage(BaseModel):
    id: str
    sender: str
    subject: str
    body: str
    has_attachment: bool = False
    amount: Optional[float] = None
    due_date: Optional[str] = None


class EmailTriageSubagent(BaseOOAgent):
    """
    Subagent responsible for processing email threads, categorizing messages,
    flagging unpaid utility bills, and queuing high-value items for Human approval.
    """

    def __init__(self):
        super().__init__(
            node_id="email_triage_subagent",
            name="Email & Bill Triage Subagent",
            agent_type="Subagent"
        )
        # Explicit Object State
        self.processed_emails_count: int = 0
        self.flagged_bills_count: int = 0
        self.auto_pay_threshold: float = 100.0  # Payments above $100 require HITL approval

    def handle_delegated_task(self, task: Task) -> Task:
        """Handles delegated email/bill tasks dynamically."""
        email = EmailMessage(
            id=f"email_{task.task_id}",
            sender="billing@powerco.com",
            subject=task.title,
            body=task.description or "Urgent bill payment required",
            amount=task.amount or 142.50,
            due_date="2026-08-05"
        )
        return self.process_email(email)


    @agentic_action(description="Classifies email messages into bill, calendar_event, or general")
    def classify_email(self, email: EmailMessage) -> Literal["bill", "event", "general"]:
        """Deterministic classification heuristic (mocking Gemini LLM inference)."""
        subj = email.subject.lower()
        if "bill" in subj or "invoice" in subj or "statement" in subj or email.amount is not None:
            return "bill"
        elif "meeting" in subj or "invitation" in subj or "schedule" in subj:
            return "event"
        return "general"

    @agentic_action(description="Processes an incoming email and generates appropriate Task Card")
    def process_email(self, email: EmailMessage) -> Task:
        """
        Processes an email message and creates a Task Card in the Master System.
        If a bill is over the auto_pay_threshold ($100), places it in WAITING_FOR_APPROVAL status.
        """
        self.set_status(AgentStatus.RUNNING, active_step=f"Processing email: {email.subject}")
        self.log(f"Received email from {email.sender}: '{email.subject}'")

        category = self.classify_email(email)
        self.processed_emails_count += 1

        if category == "bill":
            amount = email.amount or 142.50
            vendor = email.sender.split("@")[0].title()
            
            task = Task(
                task_id=f"bill_{email.id}",
                title=f"Pay {vendor} Bill (${amount:.2f})",
                description=f"Invoice received via email. Due date: {email.due_date or 'Friday'}.",
                creator="EmailTriageSubagent",
                assignee_type=AssigneeType.AGENT,
                assignee_id="PaymentExecutionSubagent",
                priority=TaskPriority.HIGH if amount > self.auto_pay_threshold else TaskPriority.MEDIUM,
                amount=amount,
                vendor=vendor,
                due_date=email.due_date or "2026-08-05",
            )
            
            if amount > self.auto_pay_threshold:
                task.status = TaskStatus.WAITING_FOR_APPROVAL
                task.actions = [
                    TaskAction(label=f"Approve ${amount:.2f}", action_key="APPROVE_PAYMENT", style="success"),
                    TaskAction(label="Reject", action_key="REJECT_PAYMENT", style="danger")
                ]
                task.add_log(
                    author="EmailTriageSubagent",
                    message=f"Bill amount (${amount:.2f}) exceeds auto-pay threshold (${self.auto_pay_threshold:.2f}). Placed in HITL Approval Queue."
                )
                self.flagged_bills_count += 1
                self.set_status(AgentStatus.WAITING_FOR_APPROVAL, active_step="Waiting for human bill payment approval")
            else:
                task.status = TaskStatus.DONE
                task.add_log(
                    author="EmailTriageSubagent",
                    message=f"Bill amount (${amount:.2f}) within auto-pay threshold. Executed automatically."
                )
                self.set_status(AgentStatus.IDLE, active_step="Idle")

            self.sync_node_state()
            return task

        else:
            task = Task(
                task_id=f"email_{email.id}",
                title=f"Review Email: {email.subject}",
                description=f"From: {email.sender}\nSummary: {email.body[:100]}...",
                creator="EmailTriageSubagent",
                assignee_type=AssigneeType.HUMAN,
                assignee_id="human_user",
                status=TaskStatus.TODO,
                priority=TaskPriority.LOW
            )
            task.add_log(author="EmailTriageSubagent", message="General email cataloged for human review.")
            self.set_status(AgentStatus.IDLE, active_step="Idle")
            self.sync_node_state()
            return task
