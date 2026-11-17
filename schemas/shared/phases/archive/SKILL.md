---
name: archive
description: Archive a change. Consolidates a verified change's specs, decisions and procedures and moves it to the archive, by rule and without asking. Use when the person asks to archive, close or finish a verified change.
---

# archive

Archiving applies what the plan decided. The command does all of it.

1. `pnpm exec factory doctor`. When it prints anything as `missing` or `drift`, follow the `setup` skill first. A `note` is for the person: relay it once and go on. So is a `suspect`, a runbook that runs what the project no longer has: relay it once and go on; the `plan` skill investigates it.
2. `pnpm exec factory archive <change>`; with no name it archives every verified change, oldest first.
3. Relay its report line by line. An `archived` change is done. For each `still active` one, say why. When the reason is a tag that no longer holds, it raised feedback: follow the `feedback` skill for that change.
