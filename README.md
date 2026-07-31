# Personal Life Automation & Agentic Graph Engine

A high-quality, modular, object-oriented personal automation system featuring:
- **Unified Master Task Model**: Human TODOs and Agent Tasks in a single workflow.
- **Native Object-Oriented Agents (NOOA)**: Agent classes with typed contracts and docstring prompts.
- **Visual Graph Topology Inspector**: Real-time state visualization of running agents.
- **Dynamic Skill-Driven UI Engine**: Schema-generated UI controls with hot-reloading.
- **FastAPI REST API**: Serving local web & mobile PWA surfaces.

## Getting Started

1. Activate virtual environment:
   ```bash
   source .venv/bin/activate
   ```
2. Run test suite:
   ```bash
   pytest -v
   ```
3. Launch API Server:
   ```bash
   uvicorn app.api.server:app --reload --port 8000
   ```
