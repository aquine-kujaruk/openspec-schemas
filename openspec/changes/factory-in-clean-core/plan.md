---
name: factory-in-clean-core
description: The command's code moves from toolkit/ to factory/, split by role and laid out in the clean core's layers, and what only this repository runs moves to tools/, which no package carries
created_at: 2026-11-17
created_by: the person
approved_at: 2026-11-17
schema: spec-plan
---

# The factory in the clean core

## Goal

The command's code reads as the system it is. `factory/` holds the command: an entry that composes, the modules `repository`, `flow`, `architecture` and `package` laid out in the clean core's layers, `shared` for what two modules use, and `sdk`, the one surface `schemas/` and `packages/` import. `tools/` holds what only this repository runs (build, release, proof, expect), and no package carries it. Each folder says what its files may import, no module imports another in a cycle, only resource adapters touch the environment, and a test holds all of it.

## Findings

- `toolkit/` holds 54 source files (6 977 lines) and 8 602 lines of tests; 35 of the 54 import `node:fs` or `node:child_process` next to their logic (`git ls-files toolkit`, `wc -l`, `grep` @decbafd, seen 2026-11-17).
- The areas import each other in cycles: flow ↔ package (`flow/evidence.ts` → `package/guard.ts` `productRoots`; `package/guard.ts`, `package/gate.ts` → `flow/validate.ts` `changesInImplementation`), flow ↔ repository (`repository/schema.ts` → `flow/validation.ts` type `Validator`; `flow/validate.ts`, `verify.ts`, `implement.ts` → `repository/schema.ts`), package ↔ repository (`repository/schemas.ts` → `package/doctor.ts` `readInstalled`). `flow` and `package` reach `architecture` only for `architecture/review/env.ts` `loadEnv`; `architecture/generate.ts` reaches `flow/merged.ts` `mergedSpecs` (imports outside tests @decbafd, seen 2026-11-17).
- The built command carries the repository's own commands: the command tarball of `dist/fullstack` holds `toolkit/repository/build.js`, `release.js`, `toolkit/package/proof.js` and `toolkit/architecture/expect.js`, and `factory help` lists `build`, `release`, `proof` and `expect` in every project (`tar tzf` of the tarball; `toolkit/cli.ts` `USAGE` @decbafd, seen 2026-11-17).
- 34 files of `schemas/` and `packages/` import 16 distinct files of `toolkit/` by relative paths up to six folders deep (`grep -rhoE 'toolkit/[a-z/-]+\.ts' schemas packages`, seen 2026-11-17).
- This repository installs itself as `factory` (`"factory": "link:."` in devDependencies) and exports `.` as `toolkit/core/config.ts`; a project's `factory.config.ts` imports `defineFactory` from `factory` (`package.json`, `factory.config.ts` @decbafd, seen 2026-11-17).
- The build compiles every file reached from `toolkit/cli.ts`, `toolkit/core/config.ts` and the schema definitions, writes declarations for `config.ts` and `types.ts`, and sets the built command's `bin` to `toolkit/cli.js` (`toolkit/repository/build.ts:246-276` @decbafd, seen 2026-11-17).
- The decision `toolkit-follows-the-spec-areas` is enforced by `toolkit/core/layout.test.ts`, which requires exactly `cli.ts` and five flat folders, `architecture/review` excepted (`openspec/adr/product/layout.md`, `toolkit/core/layout.test.ts` @decbafd, seen 2026-11-17).
- In the clean core, infrastructure holds only `adapters/`, `acl/` and `repository-implementations/`; an adapter is a resource adapter and the only place the environment lives; the entry composes adapters, repositories and use cases (`openspec/specs/architecture/infrastructure/spec.md`, `openspec/specs/architecture/adapters/spec.md`, seen 2026-11-17).
- The clean core has no delivery layer; a schema that names a framework adds it per module in `framework/`, as `clean-react` does (`schemas/clean-backend/schema.ts`, `toolkit/core/types.ts` `modules`, seen 2026-11-17).
- Two consolidated specs name paths of `toolkit/`: `package/write-guard` (`node_modules/factory/toolkit/cli.js`, the installed command) and `flow/verify` (`toolkit/flow`, `toolkit/flow/verify.feature.test.ts`) (`grep -rn toolkit openspec/specs`, seen 2026-11-17).
- Nine standing decisions carry `@applies:toolkit`, in `openspec/adr/product/{flow,implementer,packaging,products,schemas}.md`; archiving keeps `@applies`, `@enforced` and `@by` on what it consolidates and stamps it with the archiving change's origin (`toolkit/flow/archive.ts:46-57` @decbafd, seen 2026-11-17).
- `CONTRIBUTING.md` and `.github/workflows/release.yml` run `pnpm exec factory build <package>` and `pnpm exec factory release --push origin`; `vitest.config.ts` names `toolkit/architecture/<test>.test.ts` for the per-holder tests and includes `toolkit/**/*.test.ts` (@decbafd, seen 2026-11-17).
- `v0.13.0` is tagged and `package.json` says `0.13.0` (`git tag`, `package.json` @decbafd, seen 2026-11-17).
- The guard refuses every write under `node_modules`, whatever its path below (`toolkit/package/guard.ts:71` @decbafd, seen 2026-11-17).

## Decisions

- One change of `spec-plan` whose phases go roles, then cycles, then layers module by module; the policy opens several changes only when an intention needs several schemas or touches several declared products, and this repository declares none. @by:agent
- The clean core's layers in each module, without its tactical rules: use cases stay functions, contracts are TypeScript types, nothing becomes a class with `execute()` or a zod schema. Discarded: the factory as a `clean-backend` product checked by `factory check`, which would make this repository declare products (each change names one and writes only its folder) and move the tests out of the code. @by:person
- The command's folder is `factory/`, the name of its binary, its package and `factory.config.ts`. Discarded: `src/`, `cli/` (the folder also holds the engine and the SDK) and keeping `toolkit/`. @by:person
- `schemas/` and `packages/` import the factory only from `factory/sdk`, a facade with no logic of its own. Discarded: importing it all from `factory`, which would show projects helpers they never use, and relative paths to `sdk/`. @by:person
- `build`, `release`, `proof` and `expect` move to `tools/`, which no package carries; `pnpm exec factory <command>` still runs them in this repository, since `main.ts` registers them only when `tools/` sits next to `factory/`. Discarded: pnpm scripts apart, and keeping them in the packages. @by:person
- The delivery layer (the commands and the hooks that receive the person or the agent) lives in each module's `framework/`, as in `clean-react`. Discarded: every command next to the entry, which reaches into modules from outside. @by:person
- Adapters live inside `infrastructure/`, next to `acl/` and `repository-implementations/`; in `factory/`, "adapter" means only a resource adapter. @by:person
- `core/` becomes `shared/`, so that "core" means only the clean core; the modules keep the names of the areas of `openspec/specs`. @by:agent
- Modules may import each other along repository ← flow ← architecture, package, and only another module's application or domain. Discarded: the clean core's strict isolation, since the guard, the gate and generation read flow's state, and isolation would duplicate it or wire every such call through the entry. @by:agent
- Tests stay next to the code they test; a module's feature tests (`*.feature.steps.ts`, `*.feature.test.ts`) sit at the module's root. @by:agent
- The nine standing decisions tagged `@applies:toolkit` are not modified: modifying them would restamp their origin and force an author onto five that never recorded one. The new layout decision says that `toolkit` in an older `@applies` means `factory/`. @by:agent
- The version rises to `0.14.0`: the packages' command changes its path and drops four commands, and `0.13.0` is released. @by:agent
- Planned while `publish-from-github` and `approve-then-implement` were open; both were archived (5ea062f, decbafd) before this plan was written, so nothing waits for them. @by:agent

## Open questions

## Architecture decisions

### Decision: factory-in-clean-core-layers · The command's code follows the clean core's layers

@replaces:toolkit-follows-the-spec-areas @base:2026-11-14-organize-the-toolkit @area:product @topic:layout @applies:factory,tools,schemas,packages @enforced:layout-test @by:person

The command's code SHALL live under `factory/`: the entry files directly under it (`main.ts` and one composition file per module), the modules `repository`, `flow`, `architecture` and `package`, named after the areas of `openspec/specs`, `shared` for what two modules use, and `sdk`, the only part `schemas/` and `packages/` import, as `factory/sdk`. A module and `shared` SHALL hold only `domain/`, `application/`, `infrastructure/` (holding only `acl/`, `repository-implementations/` and `adapters/`), `framework/` (the commands and hooks that receive the person or the agent) and, at a module's root, its feature tests. Domain SHALL import only domain; application only domain; infrastructure only application and domain; framework only application and domain; only the entry composes them. Only `infrastructure/adapters` SHALL touch the environment: files, processes, environment variables, the network. A module SHALL import another only through that module's application or domain, along repository ← flow ← architecture, package, and never in a cycle. What only this repository runs SHALL live in `tools/`, which no package carries. In a decision written before this one, `@applies:toolkit` means `factory/`.

**Why** The person reads a folder to know what a file may import, and an agent works from the same map. The factory teaches the clean core; its own code now follows it, so whoever reads the repository learns one vocabulary.

**Alternatives** Grouping by the area of the specs only, as `toolkit/` did: four cycles between areas, and disk and processes mixed with logic in 35 of 54 files. The factory as a `clean-backend` product: checked by its own `factory check`, but it makes this repository declare products, splitting most of its changes in two.

**Consequences** Every file of a module sits in a layer folder, and what reads files or runs processes moves into adapters. The layout test fails on a file outside the shape, a cycle, an import against the direction, the environment touched outside an adapter, or a file of `schemas/` or `packages/` importing past `factory/sdk`.

## Procedures

## Screens

## Phases

### Phase 1: The command's code is split by role

**Seams**

```ts
// package.json
"bin": { "factory": "./factory/main.ts" },
"exports": {
  ".": "./factory/shared/domain/config.ts", // defineFactory, for a project's factory.config.ts
  "./sdk": "./factory/sdk/index.ts",        // for schemas/ and packages/
  "./package.json": "./package.json",
},

// factory/main.ts: the entry maps a command's name to its handler
export type Command = { usage: string; run: (args: string[]) => Promise<number> };

// tools/commands.ts: imported by factory/main.ts only when tools/ sits next to factory/
export const commands: Record<"build" | "release" | "proof" | "expect", Command>;

// factory/sdk/index.ts: re-exports, with no logic of its own, every type and helper
// schemas/ and packages/ import today (definitions, rules, examples, expectations,
// project, testing, plan and validation, schema loading)
export type { CoreDefinition, SchemaVariant, WorkstreamDeclaration, Layer, Rule, Vetoed, PackageManifest } from "…";
```

**Tests**

- The layout test: `factory/` holds `main.ts` and the folders `repository`, `flow`, `architecture`, `package`, `shared` and `sdk`; `tools/` holds `build`, `release`, `proof` and `expect`; no file of `schemas/` or `packages/` imports the factory other than as `factory/sdk`.
- The test generated from "A built package's command offers only what a project runs" (`repository/build`), next to its step adapter in `tools/`.
- The tests generated from the modified `package/write-guard` and `flow/verify`.
- `pnpm exec factory proof backend`: the built package works in an empty project from its new path.

- [x] Move `toolkit/` to `factory/`, `cli.ts` to `main.ts` and `core/` to `shared/`; point `package.json` (`bin`, `exports`), the build (entry, declarations, `bin` of the built command), `vitest.config.ts` and `tsconfig.json` at the new paths
- [x] Write `factory/sdk/index.ts`, export it as `./sdk` here and from the built command, and import it as `factory/sdk` in every file of `schemas/` and `packages/` that imports the factory
- [x] Move `build`, `release`, `proof` and `expect`, with their tests and step adapters, to `tools/`; register them from `factory/main.ts` only when `tools/` exists; the build carries nothing of `tools/`
- [x] Write the step adapter `builtCommandOffers` for "A built package's command offers only what a project runs", update the step adapters of `package/write-guard` and `flow/verify` to the new paths, and run `pnpm exec factory generate`
- [x] Rewrite the layout test for this shape and for imports through `factory/sdk`; update the layout of `CONTRIBUTING.md` and every doc naming `toolkit/`
- [x] Raise `version` in `package.json` to `0.14.0`
- [x] Verify the phase: `pnpm run check`, `pnpm exec factory build backend`, `pnpm exec factory proof backend`

### Phase 2: No module imports another in a cycle

**Seams**

```ts
// factory/layout.test.ts: the modules each module may import (and shared, always)
const MAY_IMPORT = {
  repository: [],
  flow: ["repository"],
  architecture: ["repository", "flow"],
  package: ["repository", "flow"],
} as const;
```

**Tests**

- The layout test: every import between modules follows `MAY_IMPORT`; `shared` imports no module.

- [x] Move `productRoots` out of `package/guard.ts` and `readInstalled` out of `package/doctor.ts` into `repository`; move the type `Validator` into `repository`; move `loadEnv` into `shared`
- [x] Add the module graph to the layout test
- [x] Verify the phase: `pnpm run check`

### Phase 3: `shared` and `repository` in layers

**Seams**

```ts
// factory/layout.test.ts: the layers each layer may import, within a module and across through MAY_IMPORT
const LAYERS = ["domain", "application", "infrastructure", "framework"] as const;
const MAY_IMPORT_LAYER = {
  domain: ["domain"],
  application: ["domain"],
  infrastructure: ["application", "domain"],
  framework: ["application", "domain"],
} as const;
const INFRASTRUCTURE = ["acl", "repository-implementations", "adapters"] as const;
// only infrastructure/adapters may import these or read process.env
const ENVIRONMENT = ["node:fs", "node:fs/promises", "node:child_process", "node:os"] as const;
// modules not laid out yet; each later phase removes its own, the last leaves it empty
const PENDING = ["flow", "architecture", "package"];
```

**Tests**

- The layout test: every module outside `PENDING`, and `shared`, holds only layer folders and feature tests, follows `MAY_IMPORT_LAYER`, and touches the environment only in `infrastructure/adapters`.
- The tests of `shared` and `repository`, moved next to their code, pass unchanged in what they assert.

- [x] Lay out `shared`: configuration, platforms and types in `domain/`; paths, processes and the environment in `infrastructure/adapters/`
- [x] Lay out `repository`: schemas, products and the installed package; reading them from disk behind `acl/`, `repository-implementations/` and `adapters/`; `factory schemas` in `framework/`; its composition file under `factory/`
- [x] Add the layer rules to the layout test, with `flow`, `architecture` and `package` pending
- [x] Verify the phase: `pnpm run check`

### Phase 4: `flow` in layers

**Seams**

```ts
// factory/flow.ts: the composition of flow; builds adapters, repositories and use cases, and hands them to framework/
export const flow: Record<"validate" | "implement" | "handoff" | "reading" | "feedback" | "verify" | "archive", Command>;
```

**Tests**

- The layout test with `flow` out of `PENDING`.
- The feature tests of `flow` (archive, feedback, handoff, reading, verify), at the module's root, pass.

- [x] Lay out `flow`: changes, plans, evidence, validation and merged specs in `domain/`; validate, implement, handoff, reading, feedback, verify and archive in `application/`; the change folders, git and the specification tool behind `infrastructure/`; the commands in `framework/`
- [x] Remove `flow` from `PENDING`
- [x] Verify the phase: `pnpm run check`

### Phase 5: `architecture` in layers

**Seams**

```ts
// factory/architecture.ts: the composition of architecture
export const architecture: Record<"check" | "generate" | "test" | "prepare" | "review", Command>;
```

**Tests**

- The layout test with `architecture` out of `PENDING`.
- The per-holder tests (`case-ids`, `factory`, `module-rules`, `record-findings`, `rule-ids`, `scaffolds`) and the review's feature test pass, with `vitest.config.ts` pointing at their new paths.

- [x] Lay out `architecture`: rules, examples, expectations, the workstream graph and the review's rubric and funnel in `domain/` and `application/`; oxlint, fallow, archunit, the test runners and the decision model behind `infrastructure/`; check, generate, test, prepare and review in `framework/`
- [x] Remove `architecture` from `PENDING`
- [x] Verify the phase: `pnpm run check`

### Phase 6: `package` in layers

**Seams**

```ts
// factory/package.ts: the composition of package; guard and gate are hooks, doctor a command
export const pkg: Record<"doctor" | "guard" | "gate", Command>;
```

**Tests**

- The layout test with `PENDING` empty.
- The feature tests of `package` (completion-gate, install, setup, write-guard) pass.
- `pnpm exec factory proof backend` and `pnpm exec factory proof fullstack`: the built packages work in an empty project.

- [x] Lay out `package`: what the guard and the gate judge and what doctor diagnoses in `domain/` and `application/`; the project's files and installed skills behind `infrastructure/`; the hooks `guard` and `gate` and the command `doctor` in `framework/`
- [x] Remove `package` from `PENDING` and the list itself
- [x] Describe the layers and the module graph in the layout of `CONTRIBUTING.md`
- [x] Verify the phase: `pnpm run check`, `pnpm exec factory proof backend`, `pnpm exec factory proof fullstack`

## Feedback

## Next step
