---
name: factory-cli-through-controllers
description: Each factory module gets a controller that composes its use cases and translates arguments, hook payloads, standard input, output and exit status; the entry files only wire dependencies and keep the SDK and the CLI commands.
created_at: 2026-11-28
created_by: Edgar
approved_at: 2026-11-28
schema: spec-plan
---

# The factory's CLI goes through controllers

## Goal

Every factory module has one controller that composes its use cases and translates what a transport brings (arguments, a hook payload, standard input) into a call to the core, and its result into output and an exit status. `factory/main.ts` and the composition files wire dependencies and register commands; they print nothing and decide nothing. Another transport, such as an internal API, can reach the same operation through the same controller and keep its decision. The decision `cli-composition-in-framework` stops being `@enforced:pending`.

## Findings

- Output and exit handling live in the composition files: `console.log`, `process.exit`, `process.argv` or standard input appear 17 times in `factory/production.ts`, 10 in `factory/quality.ts`, 5 in `factory/engineering.ts` and 4 in `factory/maintenance.ts`; `maintainEquipment` in `factory/maintenance.ts` both runs the use case and prints the report (seen 2026-11-28).
- `factory/main.ts` registers each command with a lazy import of its composition file (`run: async (args) => (await import("./production.ts")).startStage(args)`, seen 2026-11-28).
- The layout decision `factory-is-a-clean-backend-line` lets `factory/<module>/` hold only what the clean-backend work centers make, and clean-backend has no framework layer (`openspec/adr/product/layout.md`, `schemas/clean-backend/schema.ts`, seen 2026-11-28). The decision of 2026-11-18 limits the controllers to the factory.
- The clean core's `framework` layer exists only in `clean-react` (`openspec/specs/architecture/framework/spec.md`, seen 2026-11-28).

## Decisions

- The controllers live in `factory/<module>/framework/controllers/<module>.controller.ts`; `framework` becomes an optional layer of clean-backend, with no rule binding a backend that does not have it, so the factory stays a clean-backend line and other backends are not forced to adopt it (the 2026-11-18 limit). Discarded: controllers in the entry files, which leaves the glue where it is; a folder only the factory's configuration allows. @by:person
- A controller depends on use cases and on a small `Io` port (arguments, standard input, write, exit status) that `main.ts` fills from the process; a test fills it in memory. @by:agent
- Held by a repository test that fails when an entry file under `factory/*.ts` writes output, reads `process.argv` or standard input, or calls a use case directly, and by acceptance: the same operation through the CLI and through an in-memory `Io` keeps its decision. The `controllers` workstream of clean-backend carries the delta spec `architecture/controllers`. @by:agent
- Runs last, after `adapters-wrap-external-systems` slims the composition files. @by:agent

## Open questions

## Architecture decisions

### Decision: cli-composition-in-framework · Factory's CLI glue lives in its framework controllers

@modifies:cli-composition-in-framework @base:2026-11-18-reparar-revision-semantica @area:product @topic:clean-core @applies:factory @enforced:entry-files-only-wire @by:person

Each Factory module SHALL have a controller in its framework layer that composes its use cases and translates arguments, hook payloads, standard input, output and exit status through an `Io` port. A thin outer entry SHALL wire department dependencies and keep the public SDK and CLI commands. The framework SHALL NOT call static methods of the core directly.

**Why** Another transport, such as an internal API, must reach the same core operation and keep its decision; a direct call from the CLI hides the process from the core.

**Alternatives** Applying the convention to every backend schema: discarded on 2026-11-18; clean-backend only allows the layer.

**Consequences** The layout decision allows `framework/controllers` in a factory module. Acceptance: calling the same core operation from another transport preserves its decision.

### Decision: factory-is-a-clean-backend-line · The factory is a clean-backend line checked by factory check

@modifies:factory-is-a-clean-backend-line @base:2026-11-17-factory-as-clean-backend @area:product @topic:layout @applies:factory,tools,schemas,packages @enforced:factory-check @by:agent @basis:no-fork

The command's code SHALL be a line of this plant manufactured with the clean-backend process: `factory/<module>/` holds only what the process's work centers make, including the optional `framework/controllers`, the entry files sit directly under `factory/` (`main.ts`, one composition file per module, and `sdk.ts`, the only part `schemas/` and `packages/` import, as `factory/sdk`), and the tests sit in `test/acceptance/<module>/`, `test/unit/<module>/` and `test/integration/<module>/`. `pnpm exec factory check` SHALL pass on it. What only this repository runs SHALL live in `tools/`, which no package carries, and the tests of this repository's schemas in `test/schemas/`, which the line ignores.

**Why** The factory teaches the clean core; held by the same standards it gives every line, its own code cannot drift.

**Alternatives** A folder outside the modules for the controllers: it splits a module's code in two places.

**Consequences** clean-backend accepts `framework/controllers` in a module.

## Procedures

## Screens

## Phases

### Phase 1: Clean-backend allows controllers

**Seams**

```ts
// schemas/clean-backend/workstreams/controllers/: workstream.ts, controllers.rules.ts, controllers.examples.md, SKILL.md
id: "controllers-vocabulary"                    // framework/** holds only framework/controllers/<name>.controller.ts
id: "controller-reaches-core-through-use-cases" // a controller imports application and domain only
```

**Tests**

- The tests generated from `architecture/controllers`: each case breaks its rule in the files its `expect` block records, and the reference (a module with a controller) breaks nothing.

- [x] Add the `controllers` workstream to clean-backend with its two rules, its cases, its skill and the generated tests
- [x] Verify the phase: `pnpm run check`

### Phase 2: The factory's modules have controllers

**Seams**

```ts
// factory/shared/application/io.port.ts (or domain/schemas): Io { args; stdin(): Promise<string>; write(line: string): void; status(code: number): void }
// factory/<module>/framework/controllers/<module>.controller.ts
export class ProductionController { constructor(useCases, io: Io); startStage(): Promise<void>; … }
```

**Tests**

- `test/schemas/entry-files-only-wire.test.ts`: no entry file writes output, reads `process.argv` or standard input, or calls `.execute(`.
- The factory's acceptance tests keep passing through the CLI; `test/schemas/change-control-controller.test.ts` runs the write guard through an in-memory `Io` and gets the use case's decision.

- [x] Write the `Io` port and fill it in `main.ts`
- [x] Move the translation code of `production`, `quality`, `engineering`, `maintenance` and `change-control` into their controllers
- [x] Write `entry-files-only-wire.test.ts`
- [x] Verify the phase: `pnpm run check`

## Feedback

- **the implement phase**: an optional layer of clean-backend is a workstream of the schema, `controllers` under schemas/clean-backend/workstreams, whose rules a backend notices; the change therefore carries a delta spec, architecture/controllers, and no longer skips specs
- **the implement phase**: the Io port lives in factory/shared/domain/schemas/io.schema.ts and its console implementation, consoleIo, in the shared CLI adapter; each composition file hands consoleIo to its controller, so main.ts only registers commands and does not build the port
- **the implement phase**: the line's unit tests target domain and application files only, so the entry-files test and the controller test live in test/schemas, which the line ignores; the console Io in the shared CLI adapter is typed structurally, since an adapter imports no domain schema

## Next step
