# Architectural Guardrails & System Requirements

This document specifies the strict architectural principles, domain guardrails, and coding standards for the **Personal Life Automation Engine** codebase.

---

## 🏛️ Core Architectural Principles

### 1. Zero Manual Cross-Cutting Logic (Use Interceptors)
* **Rule**: Never manually scatter cross-cutting concerns (persistence saving, audit logging, status synchronization) inside business logic functions.
* **Mechanism**: Use Python decorators (e.g. `@agentic_action`) or FastAPI middleware interceptors to handle state saving (`on_state_changed()`) automatically upon method completion.

### 2. Atomic File I/O & Safe Persistence
* **Rule**: Never overwrite files directly using standard `open(filepath, "w")`.
* **Mechanism**: Always write to a temporary file (`filepath.tmp`) first, followed by an atomic OS replacement (`os.replace(tmp_file, target_file)`). This prevents file corruption during server crashes or power failures.

### 3. Collision-Proof Identifiers
* **Rule**: Never generate entity IDs using container lengths (e.g. `f"task_{len(tasks) + 1}"`).
* **Mechanism**: Use collision-free unique identifiers (`uuid.uuid4().hex[:8]`) or atomic sequence generators.

### 4. Dynamic Polymorphism over Hardcoded Branching
* **Rule**: Never use hardcoded type checks or `if subagent_id == "email_triage":` branches when delegating tasks or invoking tools.
* **Mechanism**: Extend abstract interfaces (e.g. `BaseOOAgent.handle_delegated_task(task)`) and rely on dynamic method dispatching and registration registries (`register_subagent()`).

### 5. Modular UI Components
* **Rule**: Keep UI views focused and modular. Avoid single-file monolithic React components exceeding 200 lines.
* **Mechanism**: Separate views into single-responsibility components (`Header.jsx`, `MasterKanbanBoard.jsx`, `VisualGraphInspector.jsx`, `SkillEditor.jsx`, `TaskModals.jsx`).

---

## 🎯 Domain Guardrails & Business Requirements

### 6. Strict Human-in-the-Loop (HITL) Financial Interruption
* **Rule**: Any agent action involving monetary transaction/payment exceeding the `financial_approval_limit` (default $100) MUST interrupt execution and place the task in `WAITING_FOR_APPROVAL` status.
* **Mechanism**: NEVER execute financial payments automatically above threshold. Always generate interactive HITL action buttons (`[Approve]`, `[Reject]`) for human confirmation.

### 7. 100% Dynamic Skill-Driven UIs (No Hardcoded Forms)
* **Rule**: UI forms, sliders, toggles, deal cards, and opportunity widgets MUST be generated dynamically from `ui_schema` YAML blocks in `SKILL.md` packages.
* **Mechanism**: Never hardcode component forms for specific subagent tasks. Render widgets dynamically from parsed `SkillDefinition.ui_schema`.

### 8. Hot-Reloading Without Server Restarts
* **Rule**: Modifying skill prompts, guardrail rules, or `ui_schema` on disk or via mobile UI MUST be picked up live by agents without requiring backend server restarts.
* **Mechanism**: Use dynamic `reload_skills()` re-scanning on skill endpoints and disk file watchers.

### 9. Pixel 9 Pro XL Mobile-First Design
* **Rule**: All UI surfaces must be optimized for mobile PWA usage on Pixel 9 Pro XL (120Hz high refresh rate CSS, min 48px touch targets, responsive bottom navigation, and camera receipt scanning).

---

## 🧪 Verification Protocol

### 10. Automated Pre-Commit Verification
* **Rule**: Never declare a feature or bug fix complete without running automated verification.
* **Mechanism**: Always run `.venv/bin/pytest -v` (backend) and `npm run build` (frontend) before completing any task.

---

## 🚀 Recommended Slash Command

You can use the `/learn` slash command at any point to save customized workflow rules into your environment settings!
