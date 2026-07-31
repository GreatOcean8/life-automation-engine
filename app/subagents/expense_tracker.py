"""
Multimodal Expense & Receipt Scanner Subagent.
Processes receipt photos/invoices and converts them to structured expense task items.
"""

from typing import Dict, List, Optional
from pydantic import BaseModel
from app.core.agent_base import BaseOOAgent, agentic_action
from app.domain.models import Task, TaskStatus, TaskPriority, AssigneeType, TaskAction, AgentStatus


class ReceiptScanResult(BaseModel):
    vendor: str
    amount: float
    category: str
    transaction_date: str
    items_count: int
    raw_text: Optional[str] = None


class ExpenseSubagent(BaseOOAgent):
    """
    Subagent responsible for processing receipt photos (multimodal inputs)
    and generating structured expense Task Cards.
    """

    def __init__(self):
        super().__init__(
            node_id="expense_subagent",
            name="Expense & Invoice Subagent",
            agent_type="Subagent"
        )
        # Explicit Object State
        self.total_expenses_processed: int = 0
        self.total_amount_logged: float = 0.0

    @agentic_action(description="Parses receipt image payload into structured ReceiptScanResult")
    def parse_receipt_image(self, image_data: str, mock_vendor: str = "Whole Foods", mock_amount: float = 84.20) -> ReceiptScanResult:
        """Simulates Gemini multimodal vision extraction on image data."""
        return ReceiptScanResult(
            vendor=mock_vendor,
            amount=mock_amount,
            category="Groceries",
            transaction_date="2026-07-31",
            items_count=6,
            raw_text="Whole Foods Market - Total: $84.20"
        )

    @agentic_action(description="Processes receipt photo and creates a logged Expense Task Card")
    def process_receipt_photo(self, image_data: str, mock_vendor: str = "Whole Foods", mock_amount: float = 84.20) -> Task:
        self.set_status(AgentStatus.RUNNING, active_step="Parsing multimodal receipt image with Gemini Vision")
        self.log(f"Processing receipt photo upload ({len(image_data)} chars payload)")

        receipt = self.parse_receipt_image(image_data, mock_vendor, mock_amount)
        self.total_expenses_processed += 1
        self.total_amount_logged += receipt.amount

        task = Task(
            task_id=f"expense_{self.total_expenses_processed}",
            title=f"Expense Logged: {receipt.vendor} (${receipt.amount:.2f})",
            description=(
                f"Vendor: {receipt.vendor}\n"
                f"Category: {receipt.category}\n"
                f"Date: {receipt.transaction_date}\n"
                f"Items Count: {receipt.items_count}"
            ),
            creator="ExpenseSubagent",
            assignee_type=AssigneeType.HUMAN,
            assignee_id="human_user",
            status=TaskStatus.DONE,
            priority=TaskPriority.LOW,
            amount=receipt.amount,
            vendor=receipt.vendor,
            ui_schema={
                "card_template": "expense_log_card",
                "vendor": receipt.vendor,
                "category": receipt.category,
                "formatted_amount": f"${receipt.amount:.2f}"
            }
        )
        task.add_log(
            author="ExpenseSubagent",
            message=f"Successfully extracted expense via Multimodal Vision: ${receipt.amount:.2f} at {receipt.vendor}."
        )
        self.log(f"Expense Logged: ${receipt.amount:.2f} at {receipt.vendor}")
        self.set_status(AgentStatus.IDLE, active_step="Idle")
        self.sync_node_state()
        return task
