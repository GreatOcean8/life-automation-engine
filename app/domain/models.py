"""
Domain models for the Personal Life Automation Engine.
Implements the Unified Master Task Model, Agent Graph Nodes, and Skill Schemas.
"""

from enum import Enum
from typing import Any, Dict, List, Optional
from datetime import datetime
from pydantic import BaseModel, Field


class TaskStatus(str, Enum):
    TODO = "TODO"
    DELEGATED = "DELEGATED"
    RUNNING = "RUNNING"
    WAITING_FOR_APPROVAL = "WAITING_FOR_APPROVAL"
    DONE = "DONE"
    CANCELLED = "CANCELLED"


class TaskPriority(str, Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    URGENT = "URGENT"


class AssigneeType(str, Enum):
    HUMAN = "HUMAN"
    AGENT = "AGENT"


class TaskAction(BaseModel):
    label: str
    action_key: str
    style: str = "primary"  # primary, secondary, danger, success
    payload: Dict[str, Any] = Field(default_factory=dict)


class TaskLog(BaseModel):
    timestamp: str = Field(default_factory=lambda: datetime.now().isoformat())
    author: str  # e.g., "Human", "MasterOrchestrator", "EmailSubagent"
    message: str
    details: Optional[Dict[str, Any]] = None


class Task(BaseModel):
    task_id: str
    title: str
    description: Optional[str] = ""
    assignee_type: AssigneeType = AssigneeType.HUMAN
    assignee_id: str = "human_user"  # "human_user" or agent name e.g. "EmailTriageSubagent"
    creator: str = "human_user"
    status: TaskStatus = TaskStatus.TODO
    priority: TaskPriority = TaskPriority.MEDIUM
    created_at: str = Field(default_factory=lambda: datetime.now().isoformat())
    updated_at: str = Field(default_factory=lambda: datetime.now().isoformat())
    due_date: Optional[str] = None
    
    # Financial HITL fields
    amount: Optional[float] = None
    vendor: Optional[str] = None
    
    # Dynamic UI & Execution metadata
    ui_schema: Optional[Dict[str, Any]] = None
    actions: List[TaskAction] = Field(default_factory=list)
    logs: List[TaskLog] = Field(default_factory=list)
    metadata: Dict[str, Any] = Field(default_factory=dict)

    def add_log(self, author: str, message: str, details: Optional[Dict[str, Any]] = None):
        self.logs.append(TaskLog(author=author, message=message, details=details))
        self.updated_at = datetime.now().isoformat()


class AgentStatus(str, Enum):
    IDLE = "IDLE"
    RUNNING = "RUNNING"
    WAITING_FOR_APPROVAL = "WAITING_FOR_APPROVAL"
    PAUSED = "PAUSED"
    ERROR = "ERROR"


class AgentNode(BaseModel):
    node_id: str
    name: str
    agent_type: str  # e.g. "Orchestrator", "Subagent"
    status: AgentStatus = AgentStatus.IDLE
    active_step: Optional[str] = "Idle"
    active_subagents: List[str] = Field(default_factory=list)
    live_state_payload: Dict[str, Any] = Field(default_factory=dict)
    execution_logs: List[str] = Field(default_factory=list)
    last_run_at: Optional[str] = None

    def update_status(self, status: AgentStatus, active_step: str = ""):
        self.status = status
        if active_step:
            self.active_step = active_step
        self.last_run_at = datetime.now().isoformat()

    def log(self, message: str):
        timestamp = datetime.now().strftime("%H:%M:%S")
        self.execution_logs.append(f"[{timestamp}] {message}")


class UpdateTaskRequest(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    priority: Optional[TaskPriority] = None
    status: Optional[TaskStatus] = None


class UIControlSchema(BaseModel):

    id: str
    label: str
    type: str  # "slider", "toggle", "tag_input", "number", "text"
    min: Optional[float] = None
    max: Optional[float] = None
    step: Optional[float] = None
    default: Any = None


class SkillDefinition(BaseModel):
    name: str
    description: str
    ui_schema: Dict[str, Any] = Field(default_factory=dict)
    instructions: str = ""
    rules: List[str] = Field(default_factory=list)
