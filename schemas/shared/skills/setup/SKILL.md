---
name: setup
description: Set the project up for the factory's phases. Pins the `factory` command every phase skill calls and repairs what the package owns in the project. Use before the first phase runs in a project, and whenever `pnpm exec factory doctor` prints something as missing or drift.
---

# setup

Every phase skill calls one command, `pnpm exec factory`. It ships with this skill as `assets/factory-<version>.tgz`.

1. Pin the command when `pnpm exec factory --version` does not print the version in that file name: `pnpm add -D <this skill's folder>/assets/factory-<version>.tgz`.
2. `pnpm exec factory doctor --fix`. It repairs what the package owns: the pinned command, the links to its schemas, the default schema, the consolidated roots, and the flow instruction in an instruction file the project wrote.
3. Tell the person every line it still prints as `missing` and every `note`: those are theirs to settle. Relay every `suspect` once too: a runbook that runs what the project no longer has, which the `plan` skill investigates. Relay every `outdated` line too: a rule the update added or changed that the code breaks; repair never clears it, a change that adapts the code does, and the next passing `pnpm exec factory check` records the new rules. Setup is done when `pnpm exec factory doctor` prints `nothing is lacking`.
