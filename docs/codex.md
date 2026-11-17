# Codex

Codex loads a project's hooks and its `AGENTS.md` only in a project it trusts, and runs a hook only after it was reviewed. Trust the project, then review each hook with `/hooks`. Do it again after every update of the package that changes a hook: Codex skips a changed hook until it is reviewed.
