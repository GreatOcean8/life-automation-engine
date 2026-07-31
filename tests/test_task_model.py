"""
Unit tests for Domain Models and Unified Task Engine.
"""

from app.domain.models import Task, TaskStatus, TaskPriority, AssigneeType, TaskAction


def test_task_creation():
    task = Task(
        task_id="t1",
        title="Test Task",
        assignee_type=AssigneeType.HUMAN,
        status=TaskStatus.TODO
    )
    assert task.task_id == "t1"
    assert task.status == TaskStatus.TODO
    assert len(task.logs) == 0


def test_task_log_addition():
    task = Task(task_id="t2", title="Log Task")
    task.add_log(author="Human", message="Initial creation")
    assert len(task.logs) == 1
    assert task.logs[0].author == "Human"
    assert task.logs[0].message == "Initial creation"


def test_hitl_task_approval_structure():
    task = Task(
        task_id="bill_123",
        title="Pay Electric Bill",
        amount=142.50,
        status=TaskStatus.WAITING_FOR_APPROVAL,
        actions=[
            TaskAction(label="Approve $142.50", action_key="APPROVE_PAYMENT", style="success"),
            TaskAction(label="Reject", action_key="REJECT_PAYMENT", style="danger")
        ]
    )
    assert task.status == TaskStatus.WAITING_FOR_APPROVAL
    assert len(task.actions) == 2
    assert task.actions[0].action_key == "APPROVE_PAYMENT"
