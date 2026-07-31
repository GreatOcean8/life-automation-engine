"""
Native Object-Oriented Agent (NOOA) Base Framework.
Methods are actions, fields are state, docstrings are system instructions, and type annotations are contracts.
"""

import asyncio
import inspect
import logging
from typing import Any, Callable, Dict, List, Optional, Type, get_type_hints
from pydantic import BaseModel
from app.domain.models import AgentNode, AgentStatus

logger = logging.getLogger(__name__)


from functools import wraps

def agentic_action(name: Optional[str] = None, description: Optional[str] = None, auto_save: bool = True):
    """
    Decorator designating a method as a model-visible agentic action/tool.
    Automatically invokes self.on_state_changed() upon completion to guarantee state persistence.
    """
    def decorator(func: Callable):
        @wraps(func)
        def wrapper(self, *args, **kwargs):
            result = func(self, *args, **kwargs)
            if auto_save and hasattr(self, "on_state_changed") and callable(getattr(self, "on_state_changed")):
                try:
                    self.on_state_changed()
                except Exception as e:
                    logger.error(f"Error in automatic on_state_changed hook: {str(e)}")
            return result
        wrapper.__is_agentic_action__ = True
        wrapper.__action_name__ = name or func.__name__
        wrapper.__action_doc__ = description or inspect.getdoc(func) or ""
        return wrapper
    return decorator



class BaseOOAgent:
    """
    Base Object-Oriented Agent class.
    Attributes represent explicit, model-visible state.
    Methods represent callable deterministic tools or LLM-driven actions.
    """

    def __init__(self, node_id: str, name: str, agent_type: str = "Subagent"):
        self.node = AgentNode(
            node_id=node_id,
            name=name,
            agent_type=agent_type,
            status=AgentStatus.IDLE
        )
        self.system_prompt = inspect.getdoc(self) or f"Agent {name}"
        self._actions_registry: Dict[str, Callable] = {}
        self._register_actions()

    def handle_delegated_task(self, task: Task) -> Task:
        """
        Default delegation handler. Subclasses override this method to perform
        agent-specific business logic when assigned a task.
        """
        task.status = TaskStatus.DONE
        task.add_log(self.node.name, f"Completed task via default handler: {task.title}")
        return task

    def _register_actions(self):
        """Scans methods for agentic actions and registers them."""
        for attr_name in dir(self):
            if attr_name.startswith("_"):
                continue
            method = getattr(self, attr_name)
            if callable(method) and getattr(method, "__is_agentic_action__", False):
                action_name = getattr(method, "__action_name__", attr_name)
                self._actions_registry[action_name] = method

    def get_state_snapshot(self) -> Dict[str, Any]:
        """
        Returns model-visible state attributes (excluding private and method members).
        Converts complex non-Pydantic object instances into string summaries for safe JSON serialization.
        """
        snapshot = {}
        for k, v in self.__dict__.items():
            if k.startswith("_") or k == "node":
                continue
            if isinstance(v, BaseModel):
                snapshot[k] = v.model_dump()
            elif isinstance(v, dict):
                snapshot[k] = {
                    str(dk): (dv.model_dump() if isinstance(dv, BaseModel) else dv.node.name if hasattr(dv, "node") else str(dv))
                    for dk, dv in v.items()
                }
            elif isinstance(v, list):
                snapshot[k] = [
                    item.model_dump() if isinstance(item, BaseModel) else item.node.name if hasattr(item, "node") else str(item)
                    for item in v
                ]
            elif isinstance(v, (int, float, bool, str)) or v is None:
                snapshot[k] = v
            else:
                snapshot[k] = str(v)
        return snapshot


    def sync_node_state(self):
        """Synchronizes internal object state to the AgentNode payload for UI inspection."""
        self.node.live_state_payload = self.get_state_snapshot()

    def set_status(self, status: AgentStatus, active_step: str = ""):
        self.node.update_status(status, active_step)
        self.sync_node_state()

    def log(self, message: str):
        self.node.log(message)
        logger.info(f"[{self.node.name}] {message}")
