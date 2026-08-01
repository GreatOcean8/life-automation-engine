import pytest
from fastapi.testclient import TestClient
from app.api.server import app
from app.core.orchestrator import MasterOrchestrator

client = TestClient(app)

@pytest.fixture(autouse=True)
def isolate_test_environment(tmp_path, monkeypatch):
    """Isolates tests from mutating production tasks_store.json and audit_store.json."""
    test_orchestrator = MasterOrchestrator(data_dir=str(tmp_path), skills_dir=str(tmp_path))
    test_orchestrator.create_human_task("Call dentist to reschedule appointment", "Reschedule for next Thursday afternoon.")
    test_orchestrator.create_human_task("Review Q3 Investment Strategy", "Check portfolio allocation and cash reserves.")
    monkeypatch.setattr("app.api.server.orchestrator", test_orchestrator)


def test_health_check_endpoint():
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "online"
    assert data["system"] == "Personal Life Automation Engine"



def test_get_tasks_endpoint():
    response = client.get("/api/tasks")
    assert response.status_code == 200
    tasks = response.json()
    assert isinstance(tasks, list)
    assert len(tasks) >= 2


def test_update_and_delete_task_endpoints():
    # Create task
    create_res = client.post("/api/tasks", json={"title": "To Update Task", "description": "Old", "priority": "LOW"})
    task_id = create_res.json()["task_id"]

    # Update task
    update_res = client.put(f"/api/tasks/{task_id}", json={"title": "New Title", "priority": "HIGH"})
    assert update_res.status_code == 200
    assert update_res.json()["title"] == "New Title"
    assert update_res.json()["priority"] == "HIGH"

    # Soft Delete task
    delete_res = client.delete(f"/api/tasks/{task_id}")
    assert delete_res.status_code == 200
    assert delete_res.json()["status"] == "archived"

    # Restore task
    restore_res = client.post(f"/api/tasks/{task_id}/restore")
    assert restore_res.status_code == 200
    assert restore_res.json()["is_archived"] is False

    # Check Audit Logs
    audit_res = client.get("/api/audit-logs")
    assert audit_res.status_code == 200
    assert len(audit_res.json()) >= 1




def test_get_graph_nodes_endpoint():
    response = client.get("/api/graph/nodes")
    assert response.status_code == 200
    nodes = response.json()
    assert isinstance(nodes, list)
    assert len(nodes) == 5
    assert nodes[0]["node_id"] == "master_orchestrator"


def test_triggers_endpoints():
    res_email = client.post("/api/triggers/email")
    assert res_email.status_code == 200
    email_tasks = res_email.json()
    assert len(email_tasks) == 2

    res_market = client.post("/api/triggers/market")
    assert res_market.status_code == 200
    market_tasks = res_market.json()
    assert len(market_tasks) >= 1


def test_expense_multimodal_scan_endpoint():
    payload = {
        "image_data": "base64_mock_image_bytes_here",
        "mock_vendor": "Trader Joe's",
        "mock_amount": 62.40
    }
    response = client.post("/api/expenses/scan", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["vendor"] == "Trader Joe's"
    assert data["amount"] == 62.40
    assert data["status"] == "DONE"


def test_skills_endpoints():
    res_get = client.get("/api/skills")
    assert res_get.status_code == 200
    skills = res_get.json()
    assert isinstance(skills, list)

    save_payload = {
        "name": "api-test-skill",
        "description": "Created via API test",
        "instructions": "Step 1, Step 2.",
        "ui_schema": {"title": "API Skill Title"},
        "rules": ["Rule 1"]
    }
    res_save = client.post("/api/skills", json=save_payload)
    assert res_save.status_code == 200
    saved_skill = res_save.json()
    assert saved_skill["name"] == "api-test-skill"
    assert saved_skill["ui_schema"]["title"] == "API Skill Title"


def test_task_delegation_and_approval_endpoints():
    # 1. Create a task that requires HITL approval
    trigger_res = client.post("/api/triggers/email-triage")
    assert trigger_res.status_code == 200
    
    tasks_res = client.get("/api/tasks")
    assert tasks_res.status_code == 200
    approval_tasks = [t for t in tasks_res.json() if t["status"] == "WAITING_FOR_APPROVAL"]
    assert len(approval_tasks) > 0
    
    target_task_id = approval_tasks[0]["task_id"]

    # 2. Approve HITL task
    approve_res = client.post(f"/api/tasks/{target_task_id}/approve")
    assert approve_res.status_code == 200
    assert approve_res.json()["status"] == "DONE"

    # 3. Create a TODO task and delegate it
    create_res = client.post("/api/tasks", json={"title": "Delegation Test", "description": "Delegate me"})
    new_task_id = create_res.json()["task_id"]

    delegate_res = client.post(f"/api/tasks/{new_task_id}/delegate", json={"target_subagent_id": "email_triage_subagent"})
    assert delegate_res.status_code == 200
    assert delegate_res.json()["status"] in ("WAITING_FOR_APPROVAL", "RUNNING", "DONE")


def test_triggers_and_graph_endpoints():
    # Test Graph Topology
    graph_res = client.get("/api/graph/nodes")
    assert graph_res.status_code == 200
    nodes = graph_res.json()
    assert len(nodes) >= 5  # Orchestrator + 4 Subagents

def test_audit_logs_revert_endpoint_dual_stack():
    """Tests POST /api/audit-logs/{audit_id}/revert endpoint."""
    # Create task
    create_res = client.post("/api/tasks", json={"title": "Audit API Test Task", "description": "Testing revert endpoint"})
    assert create_res.status_code == 200
    task_id = create_res.json()["task_id"]

    # Delete task (soft delete)
    del_res = client.delete(f"/api/tasks/{task_id}")
    assert del_res.status_code == 200

    # Get audit logs
    audit_res = client.get("/api/audit-logs")
    assert audit_res.status_code == 200
    logs = audit_res.json()
    
    # Find TASK_DELETED log
    del_log = next(l for l in logs if l["target_id"] == task_id and l["action_type"] == "TASK_DELETED")
    assert del_log["can_revert"] is True

    # Revert via API endpoint (restores task)
    revert_res = client.post(f"/api/audit-logs/{del_log['id']}/revert")
    assert revert_res.status_code == 200
    updated_logs = revert_res.json()

    # Verify task restored
    task_res = client.get("/api/tasks")
    tasks = task_res.json()
    restored_task = next((t for t in tasks if t["task_id"] == task_id), None)
    assert restored_task is not None
    assert restored_task["is_archived"] is False






