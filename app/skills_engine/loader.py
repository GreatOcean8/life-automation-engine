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

    def save_or_update_skill(
        self, 
        name: str, 
        instructions: str, 
        rules: List[str], 
        ui_schema: Optional[Dict[str, Any]] = None,
        description: Optional[str] = ""
    ) -> Any:
        """Saves a skill definition back to disk atomically and returns previous state for audit log."""
        skill_dir = os.path.join(self.skills_dir, name)
        os.makedirs(skill_dir, exist_ok=True)
        file_path = os.path.join(skill_dir, "SKILL.md")

        # Capture previous state if file exists
        prev_instructions = ""
        prev_rules = []
        if name in self.loaded_skills:
            prev_instructions = self.loaded_skills[name].instructions
            prev_rules = list(self.loaded_skills[name].rules)

        frontmatter = {
            "name": name,
            "description": description or f"Skill package for {name}",
            "rules": rules
        }
        if ui_schema:
            frontmatter["ui_schema"] = ui_schema

        yaml_content = yaml.safe_dump(frontmatter, sort_keys=False)
        full_content = f"---\n{yaml_content}---\n\n{instructions}"

        temp_path = f"{file_path}.tmp"
        with open(temp_path, "w", encoding="utf-8") as f:
            f.write(full_content)
        os.replace(temp_path, file_path)

        skill_def = SkillDefinition(
            name=name,
            description=description or f"Skill package for {name}",
            rules=rules,
            instructions=instructions,
            ui_schema=ui_schema or {}
        )
        self.loaded_skills[name] = skill_def
        return skill_def, {"instructions": prev_instructions, "rules": prev_rules}



    def revert_skill(self, name: str, prev_state: Dict[str, Any]) -> SkillDefinition:
        """Reverts a skill to a previous state safely."""
        instructions = prev_state.get("instructions", "") if isinstance(prev_state, dict) else ""
        rules = prev_state.get("rules", []) if isinstance(prev_state, dict) else []
        ui_schema = self.loaded_skills[name].ui_schema if name in self.loaded_skills else {}
        return self.save_or_update_skill(name, instructions, rules, ui_schema)[0]

