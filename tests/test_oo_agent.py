"""
Unit tests for Object-Oriented Agent (NOOA) Base Class.
"""

from app.core.agent_base import BaseOOAgent, agentic_action
from app.domain.models import AgentStatus


class MockAgent(BaseOOAgent):
    """Docstring persona prompt for MockAgent."""

    def __init__(self):
        super().__init__(node_id="mock_agent", name="Mock Agent")
        self.counter: int = 5
        self.active_flag: bool = True

    @agentic_action(description="Increments the internal counter")
    def increment(self, step: int = 1) -> int:
        self.counter += step
        return self.counter


def test_oo_agent_initialization():
    agent = MockAgent()
    assert agent.node.name == "Mock Agent"
    assert agent.system_prompt == "Docstring persona prompt for MockAgent."
    assert "increment" in agent._actions_registry


def test_oo_agent_state_snapshot():
    agent = MockAgent()
    snapshot = agent.get_state_snapshot()
    assert snapshot["counter"] == 5
    assert snapshot["active_flag"] is True


def test_oo_agent_action_execution():
    agent = MockAgent()
    res = agent.increment(3)
    assert res == 8
    assert agent.counter == 8
    snapshot = agent.get_state_snapshot()
    assert snapshot["counter"] == 8


def test_agent_status_update():
    agent = MockAgent()
    agent.set_status(AgentStatus.RUNNING, active_step="Processing test")
    assert agent.node.status == AgentStatus.RUNNING
    assert agent.node.active_step == "Processing test"
