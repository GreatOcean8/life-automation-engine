"""
Unit tests for all specialized subagents in app/subagents/.
Covering EmailTriage, RealEstate, JobScanner, and ExpenseTracker subagents.
"""

import pytest
from app.subagents.email_triage import EmailTriageSubagent, EmailMessage
from app.subagents.real_estate import RealEstateSubagent, PropertyListing
from app.subagents.job_scanner import JobScannerSubagent, JobPosting
from app.subagents.expense_tracker import ExpenseSubagent
from app.domain.models import TaskStatus, AssigneeType


def test_email_triage_subagent_auto_pay_under_threshold():
    agent = EmailTriageSubagent()
    email = EmailMessage(
        id="e101",
        sender="billing@utility.com",
        subject="Water Bill",
        body="Your water bill of $45.00 is due.",
        due_date="2026-08-15",
        amount=45.0,
        vendor="Water Utility"
    )
    task = agent.process_email(email)
    
    assert task is not None
    assert task.amount == 45.0
    assert task.status == TaskStatus.DONE
    assert "Executed automatically" in task.logs[0].message


def test_email_triage_subagent_hitl_approval_over_threshold():
    agent = EmailTriageSubagent()
    email = EmailMessage(
        id="e102",
        sender="billing@electric.com",
        subject="Electric Bill",
        body="Your electric bill of $250.00 is due.",
        due_date="2026-08-20",
        amount=250.0,
        vendor="Electric Co"
    )
    task = agent.process_email(email)

    assert task is not None
    assert task.amount == 250.0
    assert task.status == TaskStatus.WAITING_FOR_APPROVAL
    assert len(task.actions) == 2
    assert task.actions[0].action_key == "APPROVE_PAYMENT"


def test_real_estate_subagent_deal_evaluation():
    agent = RealEstateSubagent()
    listing = PropertyListing(
        listing_id="re101",
        address="704 S Lamar Blvd",
        price=600000.0,
        sqft=1800,
        monthly_rent_estimate=4200.0,
        bedrooms=3,
        bathrooms=2.0,
        zip_code="78704"
    )
    task = agent.evaluate_listing(listing)

    assert task is not None
    assert task.ui_schema["card_template"] == "property_deal_card"
    assert task.ui_schema["deal_score"] == "GREAT_DEAL"
    assert task.status in (TaskStatus.RUNNING, TaskStatus.TODO)


def test_job_scanner_subagent_matching():
    agent = JobScannerSubagent()
    job = JobPosting(
        job_id="j101",
        title="Staff AI Engineer",
        company="OpenAI",
        salary_min=220000,
        salary_max=300000,
        location="Remote",
        is_remote=True,
        skills_required=["Python", "AI", "Agent", "Architect"],
        job_url="https://jobs.example.com/ai-staff"
    )
    task = agent.evaluate_job(job)

    assert task is not None
    assert task.ui_schema["card_template"] == "job_match_card"
    assert task.ui_schema["company"] == "OpenAI"
    assert task.assignee_type == AssigneeType.HUMAN


def test_expense_tracker_subagent_vision_parsing():
    agent = ExpenseSubagent()
    task = agent.process_receipt_photo(
        image_data=b"sample_receipt_image_data"
    )

    assert task is not None
    assert task.status == TaskStatus.DONE
    assert task.ui_schema["card_template"] == "expense_log_card"
