# Evidence of schemas-as-slices

Live sessions of tasks 4.4 and 5.3, on 2026-11-14, in a scratch project with package 0.2.0 installed for both agents, each agent on its work profile. The machine's own paths are written as `<project>`, `<scratch>` and `~`; long tool output is cut.

| Transcript | What it shows |
| --- | --- |
| `codex-incident.txt` | Codex 0.166.0. An incident to diagnose: the plan skill runs `factory schemas`, opens the change with `--schema spec-plan`, and validation reports it ready. |
| `claude-behaviour.txt` | Claude Code 2.1.322. A new behaviour: the change is opened with `--schema clean-backend` and validation reports it ready. |
| `claude-bare-change.txt` | Claude Code 2.1.322, with a `spec-plan` change started by the person: a write under `src` is refused by the write guard, naming the change and its schema; a write under `docs` goes through. |
| `claude-paste.txt` | Claude Code 2.1.322 in an empty project, given the block of the README: it installs the package, pins the command, repairs the project until nothing is lacking, adds the test runner and the type checker, and lists both schemas. |
