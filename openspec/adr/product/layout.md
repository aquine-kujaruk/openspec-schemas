# layout

### Decision: factory-is-a-clean-backend-line · The factory is a clean-backend line checked by factory check

@origin:2026-11-17-factory-as-clean-backend @applies:factory,tools,schemas,packages @enforced:factory-check @by:person

The command's code SHALL be a line of this plant manufactured with the clean-backend process: `factory/<module>/` holds only what the process's work centers make, the entry files sit directly under `factory/` (`main.ts`, one composition file per module, and `sdk.ts`, the only part `schemas/` and `packages/` import, as `factory/sdk`), and the tests sit in `test/acceptance/<module>/`, `test/unit/<module>/` and `test/integration/<module>/`. `pnpm exec factory check` SHALL pass on it. What only this repository runs SHALL live in `tools/`, which no package carries, and the tests of this repository's schemas in `test/schemas/`, which the line ignores. In a decision written before this one, `@applies:toolkit` means `factory/`.

**Why** The factory teaches the clean core; held by the same standards it gives every line, its own code cannot drift into a domain that models nothing, as it did when only a hand-written layout test held it.
