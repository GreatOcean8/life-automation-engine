"""
Integration tests for FastAPI REST Endpoints.
"""

from fastapi.testclient import TestClient
from app.api.server import app

client = TestClient(app)


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

    # Delete task
    delete_res = client.delete(f"/api/tasks/{task_id}")
    assert delete_res.status_code == 200
    assert delete_res.json()["status"] == "deleted"



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
