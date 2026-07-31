"""
Unit tests for Skill Engine & Hot-Reloading Loader.
"""

import os
import shutil
import tempfile
from app.skills_engine.loader import SkillsEngine


def test_skills_loader_parses_frontmatter():
    temp_dir = tempfile.mkdtemp()
    try:
        skill_folder = os.path.join(temp_dir, "test-skill")
        os.makedirs(skill_folder)
        skill_file = os.path.join(skill_folder, "SKILL.md")

        content = """---
name: test-skill
description: Test skill description
ui_schema:
  title: "Test UI"
  controls:
    - id: test_slider
      type: "slider"
      min: 1
      max: 100
      default: 50
rules:
  - "Rule 1: Always validate input."
---

# Test Skill Instructions
Instruction body here.
"""
        with open(skill_file, "w") as f:
            f.write(content)

        engine = SkillsEngine(skills_dir=temp_dir)
        skill = engine.get_skill("test-skill")

        assert skill is not None
        assert skill.name == "test-skill"
        assert skill.description == "Test skill description"
        assert skill.ui_schema["title"] == "Test UI"
        assert len(skill.rules) == 1
        assert "Instruction body here." in skill.instructions

    finally:
        shutil.rmtree(temp_dir)


def test_skill_save_and_hot_reload():
    temp_dir = tempfile.mkdtemp()
    try:
        engine = SkillsEngine(skills_dir=temp_dir)
        assert len(engine.loaded_skills) == 0

        engine.save_or_update_skill(
            name="dynamic-skill",
            description="Created on the fly",
            instructions="Execute step A and step B.",
            ui_schema={"title": "Dynamic Title"},
            rules=["Do not violate safety policy."]
        )

        assert "dynamic-skill" in engine.loaded_skills
        updated = engine.get_skill("dynamic-skill")
        assert updated.description == "Created on the fly"
        assert updated.ui_schema["title"] == "Dynamic Title"

    finally:
        shutil.rmtree(temp_dir)
