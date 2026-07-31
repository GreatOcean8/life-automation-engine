"""
Unit tests for Local File Persistence Engine (app/storage/db.py).
"""

import os
import tempfile
from app.domain.models import Task, TaskStatus, TaskPriority
from app.storage.db import save_tasks_to_disk, load_tasks_from_disk


def test_task_persistence_save_and_load():
    temp_dir = tempfile.mkdtemp()
    temp_file = os.path.join(temp_dir, "test_tasks.json")

    try:
        task1 = Task(task_id="t_persist_1", title="Persist Task 1", status=TaskStatus.TODO)
        task2 = Task(task_id="t_persist_2", title="Persist Task 2", amount=142.50, status=TaskStatus.WAITING_FOR_APPROVAL)

        tasks_dict = {task1.task_id: task1, task2.task_id: task2}

        # Save to temp file
        save_tasks_to_disk(tasks_dict, filepath=temp_file)
        assert os.path.exists(temp_file)

        # Load back from temp file
        loaded = load_tasks_from_disk(filepath=temp_file)
        assert loaded is not None
        assert len(loaded) == 2
        assert loaded["t_persist_1"].title == "Persist Task 1"
        assert loaded["t_persist_2"].amount == 142.50
        assert loaded["t_persist_2"].status == TaskStatus.WAITING_FOR_APPROVAL

    finally:
        if os.path.exists(temp_file):
            os.remove(temp_file)
        os.rmdir(temp_dir)
