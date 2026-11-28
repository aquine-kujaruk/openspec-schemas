# layout

### Decision: factory-is-a-clean-backend-line · The factory is a clean-backend line checked by factory check

@origin:2026-11-28-factory-cli-through-controllers @applies:factory,tools,schemas,packages @enforced:factory-check @by:agent

The command's code SHALL be a line of this plant manufactured with the clean-backend process: `factory/<module>/` holds only what the process's work centers make, including the optional `framework/controllers`, the entry files sit directly under `factory/` (`main.ts`, one composition file per module, and `sdk.ts`, the only part `schemas/` and `packages/` import, as `factory/sdk`), and the tests sit in `test/acceptance/<module>/`, `test/unit/<module>/` and `test/integration/<module>/`. `pnpm exec factory check` SHALL pass on it. What only this repository runs SHALL live in `tools/`, which no package carries, and the tests of this repository's schemas in `test/schemas/`, which the line ignores.

**Why** The factory teaches the clean core; held by the same standards it gives every line, its own code cannot drift.
