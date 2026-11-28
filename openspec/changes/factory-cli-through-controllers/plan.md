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
- Held by a unit test that fails when an entry file under `factory/*.ts` writes output, reads `process.argv` or standard input, or calls a use case directly, and by acceptance: the same operation through the CLI and through an in-memory `Io` keeps its decision. No delta spec: nothing a user of the factory notices changes. @by:agent
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
// schemas/clean-backend: `framework/controllers/<name>.controller.ts` accepted in a module's vocabulary
```

**Tests**

- The clean-backend examples: a module with a controller breaks no rule; a controller that imports an adapter directly breaks `infrastructure-imports-only-core`'s framework counterpart.

- [ ] Allow `framework/controllers` in clean-backend's module vocabulary, with its cases
- [ ] Verify the phase: `pnpm run check`

### Phase 2: The factory's modules have controllers

**Seams**

```ts
// factory/shared/application/io.port.ts (or domain/schemas): Io { args; stdin(): Promise<string>; write(line: string): void; status(code: number): void }
// factory/<module>/framework/controllers/<module>.controller.ts
export class ProductionController { constructor(useCases, io: Io); startStage(): Promise<void>; … }
```

**Tests**

- `test/unit/layout/entry-files-only-wire.test.ts`: no entry file writes output, reads `process.argv` or standard input, or calls `.execute(`.
- The factory's acceptance tests keep passing through the CLI; one runs an operation through an in-memory `Io` and gets the same decision.

- [ ] Write the `Io` port and fill it in `main.ts`
- [ ] Move the translation code of `production`, `quality`, `engineering`, `maintenance` and `change-control` into their controllers
- [ ] Write `entry-files-only-wire.test.ts`
- [ ] Verify the phase: `pnpm run check`

## Feedback

## Next step
