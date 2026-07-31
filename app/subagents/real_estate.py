"""
Real Estate Market Scanner Subagent.
Evaluates property listings against cap rates, price-per-sqft, and zip code criteria.
"""

from typing import Dict, List, Optional
from pydantic import BaseModel, Field
from app.core.agent_base import BaseOOAgent, agentic_action
from app.domain.models import Task, TaskStatus, TaskPriority, AssigneeType, TaskAction, AgentStatus


class PropertyListing(BaseModel):
    listing_id: str
    address: str
    zip_code: str
    price: float
    sqft: int
    bedrooms: int
    bathrooms: float
    monthly_rent_estimate: float
    hoa_fee: float = 0.0
    photo_url: str = "https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7"


class RealEstateSubagent(BaseOOAgent):
    """
    Subagent responsible for scanning property listings, calculating cap rates,
    and creating Task Cards for high-ROI real estate deals.
    """

    def __init__(self):
        super().__init__(
            node_id="real_estate_subagent",
            name="Real Estate Scanner Subagent",
            agent_type="Subagent"
        )
        # Explicit Object State
        self.scanned_count: int = 0
        self.matched_deals_count: int = 0
        self.max_price_threshold: float = 850000.0
        self.min_cap_rate_threshold: float = 6.0  # 6% min cap rate
        self.target_zip_codes: List[str] = ["78701", "78704", "78746"]

    @agentic_action(description="Calculates Price per SqFt for a listing")
    def calculate_price_per_sqft(self, price: float, sqft: int) -> float:
        if sqft <= 0:
            return 0.0
        return price / sqft

    @agentic_action(description="Calculates annual Net Cap Rate (%)")
    def calculate_cap_rate(self, price: float, rent: float, hoa: float = 0.0) -> float:
        if price <= 0:
            return 0.0
        annual_net_income = (rent - hoa) * 12
        return (annual_net_income / price) * 100.0

    @agentic_action(description="Evaluates property listing and creates deal Task Card if criteria match")
    def evaluate_listing(self, listing: PropertyListing) -> Optional[Task]:
        self.set_status(AgentStatus.RUNNING, active_step=f"Evaluating listing: {listing.address}")
        self.scanned_count += 1
        self.log(f"Scanning property: {listing.address} (${listing.price:,.0f})")

        price_per_sqft = self.calculate_price_per_sqft(listing.price, listing.sqft)
        cap_rate = self.calculate_cap_rate(listing.price, listing.monthly_rent_estimate, listing.hoa_fee)

        is_price_match = listing.price <= self.max_price_threshold
        is_zip_match = listing.zip_code in self.target_zip_codes
        is_cap_match = cap_rate >= self.min_cap_rate_threshold

        if is_price_match and is_zip_match and is_cap_match:
            self.matched_deals_count += 1
            deal_score = "GREAT_DEAL" if cap_rate > 7.5 else "GOOD_DEAL"

            task = Task(
                task_id=f"deal_{listing.listing_id}",
                title=f"Real Estate Deal: {listing.address}",
                description=(
                    f"Price: ${listing.price:,.0f} | SqFt: {listing.sqft} (${price_per_sqft:.0f}/sqft)\n"
                    f"Est. Monthly Rent: ${listing.monthly_rent_estimate:,.0f} | Est. Cap Rate: {cap_rate:.1f}%\n"
                    f"Bed/Bath: {listing.bedrooms}b/{listing.bathrooms}ba | Zip: {listing.zip_code}"
                ),
                creator="RealEstateSubagent",
                assignee_type=AssigneeType.HUMAN,
                assignee_id="human_user",
                status=TaskStatus.TODO,
                priority=TaskPriority.HIGH if deal_score == "GREAT_DEAL" else TaskPriority.MEDIUM,
                ui_schema={
                    "card_template": "property_deal_card",
                    "photo_url": listing.photo_url,
                    "price_per_sqft": f"${price_per_sqft:.0f}",
                    "cap_rate": f"{cap_rate:.1f}%",
                    "deal_score": deal_score
                },
                actions=[
                    TaskAction(label="Save Deal", action_key="SAVE_DEAL", style="primary"),
                    TaskAction(label="Dismiss", action_key="DISMISS_DEAL", style="secondary")
                ]
            )
            task.add_log(
                author="RealEstateSubagent",
                message=f"Matched criteria! Cap Rate ({cap_rate:.1f}%) >= Threshold ({self.min_cap_rate_threshold:.1f}%)."
            )
            self.log(f"Matched Deal Found: {listing.address} (Cap Rate: {cap_rate:.1f}%)")
            self.set_status(AgentStatus.IDLE, active_step="Idle")
            self.sync_node_state()
            return task

        self.set_status(AgentStatus.IDLE, active_step="Idle")
        self.sync_node_state()
        return None
