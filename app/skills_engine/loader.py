"""
Skill Loader & Hot-Reloading Engine.
Parses SKILL.md packages, extracts YAML frontmatter (ui_schema, rules, system instructions),
and supports dynamic hot-reloading without server restarts.
"""

import os
import glob
import logging
import yaml
from typing import Dict, List, Optional
from app.domain.models import SkillDefinition

logger = logging.getLogger(__name__)


class SkillsEngine:
    def __init__(self, skills_dir: str = "skills"):
        self.skills_dir = skills_dir
        self.loaded_skills: Dict[str, SkillDefinition] = {}
        self.reload_skills()

    def reload_skills(self) -> Dict[str, SkillDefinition]:
        """
        Scans skills_dir for subdirectories containing SKILL.md files.
        Parses YAML frontmatter and body instructions.
        """
        logger.info(f"[SKILLS ENGINE] Scanning '{self.skills_dir}' for skill packages...")
        discovered_skills = {}
        
        skill_files = glob.glob(os.path.join(self.skills_dir, "**/SKILL.md"), recursive=True)
        
        for file_path in skill_files:
            try:
                skill_def = self._parse_skill_file(file_path)
                if skill_def:
                    discovered_skills[skill_def.name] = skill_def
                    logger.info(f"[SKILLS ENGINE] Successfully loaded skill: '{skill_def.name}'")
            except Exception as e:
                logger.error(f"[SKILLS ENGINE] Failed to parse {file_path}: {str(e)}")

        self.loaded_skills = discovered_skills
        return self.loaded_skills

    def _parse_skill_file(self, file_path: str) -> Optional[SkillDefinition]:
        with open(file_path, "r", encoding="utf-8") as f:
            content = f.read()

        if not content.startswith("---"):
            # Simple instruction file without frontmatter
            name = os.path.basename(os.path.dirname(file_path))
            return SkillDefinition(name=name, description="Custom skill", instructions=content)

        parts = content.split("---", 2)
        if len(parts) < 3:
            return None

        yaml_content = parts[1]
        instructions = parts[2].strip()

        metadata = yaml.safe_load(yaml_content) or {}
        name = metadata.get("name", os.path.basename(os.path.dirname(file_path)))
        description = metadata.get("description", "")
        ui_schema = metadata.get("ui_schema", {})
        rules = metadata.get("rules", [])

        return SkillDefinition(
            name=name,
            description=description,
            ui_schema=ui_schema,
            instructions=instructions,
            rules=rules
        )

    def get_skill(self, name: str) -> Optional[SkillDefinition]:
        return self.loaded_skills.get(name)

    def save_or_update_skill(self, name: str, description: str, instructions: str, ui_schema: Dict = None, rules: List[str] = None) -> SkillDefinition:
        """
        Saves or updates a skill package directly from the mobile UI, triggering immediate hot-reload.
        """
        skill_folder = os.path.join(self.skills_dir, name)
        os.makedirs(skill_folder, exist_ok=True)
        skill_file = os.path.join(skill_folder, "SKILL.md")

        metadata = {
            "name": name,
            "description": description,
            "ui_schema": ui_schema or {},
            "rules": rules or []
        }

        yaml_str = yaml.dump(metadata, sort_keys=False)
        full_content = f"---\n{yaml_str}---\n\n{instructions}"

        temp_skill_file = f"{skill_file}.tmp"
        with open(temp_skill_file, "w", encoding="utf-8") as f:
            f.write(full_content)
        os.replace(temp_skill_file, skill_file)

        logger.info(f"[HOT-RELOAD] Skill '{name}' updated on disk. Reloading skills engine...")
        self.reload_skills()
        return self.loaded_skills[name]
