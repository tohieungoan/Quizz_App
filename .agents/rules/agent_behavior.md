---
trigger: always_on
---

# Antigravity Agent Behavior & Execution Rules
- **Vietnamese Language**: Always communicate in Vietnamese as per user 
## Operational Modes
- Use `Fast Mode` for simple code edits, refactoring, and boilerplate generation.
- Only escalate to `Planning Mode` or invoke multi-agent structures for large-scale architectural changes.

## Execution Guardrails
- Before modifying any file, the agent must inspect if a related test file exists in `tests/`. If it exists, update the tests alongside the code changes.
- **Strict Anti-Loop:** If a terminal command execution fails twice with the same error, STOP immediately and notify the user. Do not attempt a third automated fix without user feedback.
- Minimize context sizes: Do not read the entire repository git history unless specifically requested via slash commands like `/git`.
- **No Ghost Deletions:** Do not delete existing comments, docstrings, or unrelated helper functions during refactoring.

## Automation & Approvals
- **Auto-Accept Safe Actions:** Automatically execute non-destructive, low-risk actions without asking for user approval (e.g., creating new empty files, writing boilerplate, fixing typos, reading logs).
- **Strict Git Approval Gate:** **MUST pause and ask for explicit user confirmation** before running *any* command that alters the Git state (e.g., `git commit`, `git push`, `git checkout`, `git stash`, `git reset`).
- **Destructive Actions:** Must ask for explicit user confirmation before running destructive commands (e.g., clearing databases, deleting files/folders).

## Package & Environment Management
- **Backend Environment:** Always activate the virtual environment before running any Python, Pytest, or Tortoise commands. Never install packages globally.
- **Frontend Package Manager:** Use `npm` if `package-lock.json` exists, or `pnpm` if `pnpm-lock.yaml` exists. Never mix package managers.
- **Dependency Integrity:** Always update `requirements.txt` or `package.json` immediately after installing any new library.