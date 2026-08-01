"""
Local File Persistence Engine for Tasks and Agent State.
Saves task state to disk in JSON format so state survives server restarts,
reboots, and code reloads without requiring external services like Firebase.
"""

import os
import json
import logging
from typing import Dict, Optional
from app.domain.models import Task

logger = logging.getLogger(__name__)

DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "data")
STORAGE_FILE = os.path.join(DATA_DIR, "tasks_store.json")


def ensure_data_dir():
    os.makedirs(DATA_DIR, exist_ok=True)


def save_tasks_to_disk(tasks: Dict[str, Task], filepath: str = STORAGE_FILE):
    """Saves tasks dictionary atomically to local JSON file using temp file replacement."""
    try:
        ensure_data_dir()
        serialized = {task_id: task.model_dump() for task_id, task in tasks.items()}
        temp_filepath = f"{filepath}.tmp"
        with open(temp_filepath, "w", encoding="utf-8") as f:
            json.dump(serialized, f, indent=2)
        os.replace(temp_filepath, filepath)
        logger.info(f"[PERSISTENCE] Atomically saved {len(tasks)} tasks to '{filepath}'.")
    except Exception as e:
        logger.error(f"[PERSISTENCE] Failed to save tasks to disk: {str(e)}")



def load_tasks_from_disk(filepath: str = STORAGE_FILE) -> Optional[Dict[str, Task]]:
    """Loads tasks dictionary from local JSON file if present."""
    if not os.path.exists(filepath):
        return None
    try:
        with open(filepath, "r", encoding="utf-8") as f:
            data = json.load(f)
        tasks = {task_id: Task.model_validate(raw) for task_id, raw in data.items()}
        logger.info(f"[PERSISTENCE] Loaded {len(tasks)} tasks from '{filepath}'.")
        return tasks
    except Exception as e:
        logger.error(f"[PERSISTENCE] Failed to load tasks from disk: {str(e)}")
        return None


AUDIT_STORAGE_FILE = os.path.join(DATA_DIR, "audit_store.json")


def save_audit_logs_to_disk(logs: list, filepath: str = AUDIT_STORAGE_FILE):
    """Saves audit logs atomically to disk."""
    try:
        ensure_data_dir()
        serialized = [entry.model_dump() if hasattr(entry, 'model_dump') else entry for entry in logs]
        temp_filepath = f"{filepath}.tmp"
        with open(temp_filepath, "w", encoding="utf-8") as f:
            json.dump(serialized, f, indent=2)
        os.replace(temp_filepath, filepath)
    except Exception as e:
        logger.error(f"[PERSISTENCE] Failed to save audit logs: {str(e)}")


def load_audit_logs_from_disk(filepath: str = AUDIT_STORAGE_FILE) -> list:
    """Loads audit logs from disk."""
    if not os.path.exists(filepath):
        return []
    try:
        with open(filepath, "r", encoding="utf-8") as f:
            data = json.load(f)
        from app.domain.models import AuditLogEntry
        return [AuditLogEntry.model_validate(raw) for raw in data]
    except Exception as e:
        logger.error(f"[PERSISTENCE] Failed to load audit logs: {str(e)}")
        return []

