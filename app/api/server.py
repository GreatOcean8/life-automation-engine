"""
FastAPI REST & Realtime API Server for the Personal Life Automation Engine.
Serves the local Web & Mobile PWA surface.
"""

from typing import Any, Dict, List, Optional
from fastapi import FastAPI, HTTPException, Body
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from app.core.orchestrator import MasterOrchestrator
from app.domain.models import Task, TaskPriority, TaskStatus, AgentNode, SkillDefinition, UpdateTaskRequest

from contextlib import asynccontextmanager

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Instantiate Master Orchestrator into app.state
    app.state.orchestrator = MasterOrchestrator()
    yield

app = FastAPI(
    title="Personal Life Automation Engine API",
    version="1.0.0",
    description="Backend API for Unified Master Task System, Graph Topology Inspector, and Skill Hot-Reloading.",
    lifespan=lifespan
)

_global_orchestrator: Optional[MasterOrchestrator] = None

def get_orchestrator() -> MasterOrchestrator:
    if hasattr(app.state, "orchestrator") and app.state.orchestrator:
        return app.state.orchestrator
    global _global_orchestrator
    if _global_orchestrator is None:
        _global_orchestrator = MasterOrchestrator()
    return _global_orchestrator


# Enable CORS for local Next.js/Vite frontend development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global Orchestrator Instance
orchestrator = MasterOrchestrator()


class CreateTaskRequest(BaseModel):
    title: str
    description: Optional[str] = ""
    priority: TaskPriority = TaskPriority.MEDIUM


class DelegateTaskRequest(BaseModel):
    target_subagent_id: str




class ExpenseScanRequest(BaseModel):
    image_data: str
    mock_vendor: Optional[str] = "Whole Foods"
    mock_amount: Optional[float] = 84.20


class SkillSaveRequest(BaseModel):
    name: str
    description: str
    instructions: str
    ui_schema: Optional[Dict[str, Any]] = None
    rules: Optional[List[str]] = None


@app.get("/")
def health_check():
    return {
        "status": "online",
        "system": "Personal Life Automation Engine",
        "active_tasks": len(orchestrator.tasks),
        "loaded_skills": len(orchestrator.skills_engine.loaded_skills)
    }


# =============================================================================
# 1. UNIFIED TASK ENDPOINTS
# =============================================================================
@app.get("/api/tasks", response_model=List[Task])
def get_tasks():
    """Returns all tasks in the Unified Master Task Store."""
    return get_orchestrator().get_all_tasks()


@app.post("/api/tasks", response_model=Task)
def create_human_task(req: CreateTaskRequest):
    """Creates a new human TODO task in the Master Task Model."""
    return get_orchestrator().create_human_task(
        title=req.title,
        description=req.description or "",
        priority=req.priority
    )


@app.post("/api/tasks/{task_id}/delegate", response_model=Task)
def delegate_task(task_id: str, req: DelegateTaskRequest):
    """Delegates a human task to a specified worker subagent."""
    result = get_orchestrator().delegate_task_to_agent(task_id, req.target_subagent_id)
    if not result:
        raise HTTPException(status_code=404, detail="Task or subagent not found.")
    return result


@app.post("/api/tasks/{task_id}/approve", response_model=Task)
def approve_task(task_id: str):
    """Approves a pending HITL task (e.g. Bill Payment > $100)."""
    approved = get_orchestrator().approve_task(task_id)
    if not approved:
        raise HTTPException(status_code=400, detail="Task cannot be approved or not found.")
    return approved


@app.put("/api/tasks/{task_id}", response_model=Task)
def update_task_endpoint(task_id: str, req: UpdateTaskRequest):
    """Updates an existing task's title, description, priority, or status."""
    updated = get_orchestrator().update_task(
        task_id=task_id,
        title=req.title,
        description=req.description,
        priority=req.priority,
        status=req.status
    )
    if not updated:
        raise HTTPException(status_code=404, detail="Task not found.")
    return updated


@app.delete("/api/tasks/{task_id}")
def delete_task_endpoint(task_id: str):
    """Soft-deletes a task from the system (moves to Archive for revert capability)."""
    success = get_orchestrator().delete_task(task_id)
    if not success:
        raise HTTPException(status_code=404, detail="Task not found.")
    return {"status": "archived", "task_id": task_id}


@app.post("/api/tasks/{task_id}/restore", response_model=Task)
def restore_task_endpoint(task_id: str):
    """Restores/Reverts a deleted or archived task back to the active TODO list."""
    restored = get_orchestrator().restore_task(task_id)
    if not restored:
        raise HTTPException(status_code=404, detail="Archived task not found.")
    return restored


@app.get("/api/audit-logs")
def get_audit_logs():
    """Returns activity audit logs for change tracking and undo capability."""
    return get_orchestrator().audit_logs



# =============================================================================
# 2. GRAPH TOPOLOGY & NODE INSPECTION ENDPOINTS
# =============================================================================
@app.get("/api/graph/nodes", response_model=List[AgentNode])
def get_graph_nodes():
    """Returns visual topology nodes and live state payloads for React Flow / Graph UI."""
    return get_orchestrator().get_graph_nodes()


# =============================================================================
# 3. BACKGROUND EVENT TRIGGERS & MULTIMODAL ENDPOINTS
# =============================================================================
@app.post("/api/triggers/email", response_model=List[Task])
@app.post("/api/triggers/email-triage", response_model=List[Task])
def trigger_email_triage():
    """Triggers periodic email inbox scan & HITL bill detection."""
    return get_orchestrator().run_email_triage_trigger()


@app.post("/api/triggers/market", response_model=List[Task])
@app.post("/api/triggers/market-scan", response_model=List[Task])
def trigger_market_scan():
    """Triggers periodic Real Estate deal evaluation and Job Market scoring."""
    return get_orchestrator().run_market_scan_trigger()


@app.post("/api/expenses/scan", response_model=Task)
def scan_receipt_photo(req: ExpenseScanRequest):
    """Simulates multimodal Gemini vision parsing of receipt camera photo."""
    task = get_orchestrator().expense_agent.process_receipt_photo(
        image_data=req.image_data,
        mock_vendor=req.mock_vendor or "Whole Foods",
        mock_amount=req.mock_amount or 142.50
    )
    get_orchestrator().tasks[task.task_id] = task
    get_orchestrator().on_state_changed()
    return task



# =============================================================================
# 4. SKILL & HOT-RELOADING ENDPOINTS
# =============================================================================
@app.get("/api/skills", response_model=List[SkillDefinition])
def get_skills():
    """Returns all loaded skills and their ui_schema definitions."""
    get_orchestrator().skills_engine.reload_skills()
    return list(get_orchestrator().skills_engine.loaded_skills.values())


@app.post("/api/skills", response_model=SkillDefinition)
def save_skill(req: SkillSaveRequest):
    """Saves or updates a skill package on disk, hot-reloading it instantly."""
    updated = get_orchestrator().skills_engine.save_or_update_skill(
        name=req.name,
        instructions=req.instructions,
        rules=req.rules,
        ui_schema=req.ui_schema,
        description=req.description or ""
    )
    if not updated:
        raise HTTPException(status_code=500, detail="Failed to save skill package.")
    return updated

