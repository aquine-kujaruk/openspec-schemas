---
name: share-the-clean-core
description: Clean Architecture becomes a named core under schemas/shared/cores that several schemas build through, its reduce workstream is renamed modules, and the toolkit learns cores, markup files and the web platform
created_at: 2026-11-15
created_by: the person
schema: spec-plan
---

# Share the clean core

## Goal

Clean Architecture stops being part of `clean-backend` and becomes a core: a named folder, `schemas/shared/cores/clean-core/`, that holds its five workstreams, lists them and says which waits for which. A schema is a core plus what it adds to it, so `clean-backend` names the core and adds nothing, and the next schema (`clean-react`, in the linked change) names the same core and adds the React workstreams. The workstream that was called `clean-architecture` is called `modules`. The toolkit can load a schema that names a core, checks files that carry markup, knows the `web` platform, and verifies each schema and each core with its own defaults in one run. `clean-backend` builds and proves exactly as before.

## Decisions

Agreed with the person in the Easel session of 2026-11-15:

- A schema is a core plus a framework. The core can be replaced (the person named hexagonal as an example) and several backends and several frontends can share one. In the person's words: "Clean Architecture es como el core del sistema, que se pudiera reemplazar por otro […] pudieran haber varios backend, pudieran haber varios frontend que compartieran el core de Clean".
- The core is shared through `schemas/shared`, grouped and named: "esos cinco pertenecen a un mismo núcleo. No podemos tener workstreams así desperdigados, hay que organizarlos". Discarded: a flat `schemas/shared/workstreams/` (what D4 of schemas-as-slices foresaw), a base schema both extend, and the front schema extending `clean-backend`.
- A core lives at `schemas/shared/cores/<core>/`. Discarded: `schemas/shared/<core>/`, where nothing says the folder is a core.
- The core is named `clean-core`. The person chose `clean` over `custom-clean` and added "Ponle clean core"; the folder is `schemas/shared/cores/clean-core/` and the schemas that name it keep the prefix `clean-`.
- A schema is named by its core and what it adds: `clean-react` for the next one. `clean-backend` keeps its name, which already follows the pattern. Discarded: naming a schema by its framework alone (`react`), which stops being unique the day a second core exists.
- The workstream `clean-architecture` is renamed `modules`, the name of the layer and of the spec it owns. Discarded: keeping the name, which would mean both the whole core and one of its five parts.
- The work is two changes. This one moves the core, renames the workstream and prepares the toolkit, and closes with the backend's own checks. `clean-react` adds the schema and the packages `frontend` and `fullstack`, and starts once this one is archived. Discarded: one change with four phases.

Taken from the code, and shown to the person in the approved synthesis:

- The toolkit lints `.tsx` files, gives the examples' tsconfig a `jsx` setting, and runs one schema per process. Today `toolkit/architecture/check.ts:117` keeps only `.ts`, and `toolkit/architecture/project.ts:15` loads one schema for the whole process. The precedent for one process per unit is products-per-folder (`plan.md:106`).
- The `web` platform is the one `arch-linter-poc@827d7a8` defines in `.factory/implementer/toolkit/platform.ts:7-21`: `window`, `document`, `localStorage`, `sessionStorage`, `navigator`, `location`, `history` and `fetch` are the environment, and `localStorage`, `sessionStorage`, `navigator` and `fetch` are persistence.

Assumptions of mine, not agreed one by one:

- A core is declared in `schemas/shared/cores/<core>/core.ts`: its name, its description, the list of its workstreams and the default of what each waits for. A schema definition gains an optional `core` field. The schema's workstreams are the core's followed by its own, and its `defaults.workstreams` is merged over the core's, so a schema can make `integrate` wait for one of its own workstreams. Discarded: the schema listing every workstream id while the core is only a folder to look in, because then nothing says which workstreams are the core and a second core could not be swapped in by changing one field.
- The core's rubric lives with the core, at `schemas/shared/cores/clean-core/review/RUBRIC.md`. Every row `clean-backend` has today (S05 to S20) is a row of the core, so the file moves whole. A schema that has rows of its own keeps them in its own `review/RUBRIC.md`, and review reads the core's rows and then the schema's.
- A workstream id is unique across a core and the schemas that name it; the build fails when a definition names a workstream its core lists.
- The layer specs stay flat at `openspec/specs/architecture/<layer>`. They get a folder per core the day a second core has a layer of the same name.
- The examples of a layer are verified with the defaults of whoever holds its workstream: the core alone for the five core workstreams (platform `node`, no framework vetoed beyond the core's own), a schema for its own. The repository's test run is split into one project per holder, selected by an environment variable, the way a product is selected by `FACTORY_PRODUCT`. Discarded: verifying the core's examples once per schema that names it, because an example written with `process` would fail under the `web` platform.
- No alias is kept for the old workstream name. A plan already written with tasks `clean-architecture: …` is reported not ready and says which workstreams the schema has. Discarded: accepting both names, which keeps the ambiguity the rename removes.
- `factory proof` checks the workstream that owns the layer `modules` instead of a workstream called by a fixed name.
- Version 0.4.0 for the package and the command: a workstream's name changes, and a definition gains a field.

## Open questions

## Architecture decisions

### Decision: core-plus-framework · A schema is a core plus what it adds to it

@adds @area:product @topic:schemas @applies:schemas,toolkit @enforced:build-spec

A schema that builds product code SHALL name one core and MAY add workstreams of its own, which are its framework. A core SHALL be a folder of `schemas/shared/cores/` that holds its workstreams, lists them and says which waits for which, and it SHALL name no framework and no package of one. A schema's name SHALL start with the short name of its core and end with what it adds: `clean-backend`, `clean-react`.

**Why** The person builds several backends and several frontends on the same Clean Architecture, and wants to be able to replace that core by another without rewriting the frameworks. Keeping the core as one named unit lets two schemas share it without one extending the other, and keeps its workstreams together.

**Alternatives** A flat `schemas/shared/workstreams/`: the five workstreams of one core would sit loose among others. A base schema that the others extend: one more schema the planner could pick, for something that builds nothing alone. The front schema extending `clean-backend`: it would inherit a backend's platform and vetoes. Naming a schema by its framework alone: not unique once a second core exists.

**Consequences** A second core is a sibling folder with its own workstreams, and a schema changes core by changing one field. A workstream id cannot be reused between a core and a schema that names it. The layer specs under `openspec/specs/architecture` are shared by every schema of a core and must be split by core when a second core arrives.

## Procedures

## Phases

### Phase 1: The reduce workstream is called modules

**Tests**

The generated tests of the modified requirements of `flow/plan-validation`. The scenarios of `implementer` have no step adapter and are proved by `toolkit/architecture/module-rules.test.ts`, `toolkit/architecture/graph.test.ts` and `toolkit/core/config.test.ts`, updated to the new name. `pnpm run check` passes with no file naming `clean-architecture` as a workstream.

- [x] Rename the folder `schemas/clean-backend/workstreams/clean-architecture` to `modules`, and the workstream in `schemas/clean-backend/schema.ts` (the list and the topology)
- [x] Rename it in the toolkit and its tests (`toolkit/package/proof.ts`, `toolkit/architecture/module-rules.test.ts`, `toolkit/architecture/factory.test.ts` and every other file `grep -rn clean-architecture toolkit schemas` lists), in the workstream skills and in `schemas/shared/phases/implement/SKILL.md`
- [x] Make `factory proof` check the workstream that owns the layer `modules` instead of naming it
- [x] Copy the modified requirements of `implementer` and `flow/plan-validation` that only rename the workstream into the tests' expectations, and regenerate the tests
- [x] Verify `pnpm run check` passes and `grep -rn "clean-architecture" toolkit schemas README.md` finds the name only as prose about the architecture, never as a workstream

### Phase 2: Clean Architecture is a core that clean-backend names

**Tests**

The generated tests of `repository/build`: the modified requirements on naming and holding resources, with the new rows for a core, and the added requirement on building through the core's workstreams and the schema's own. A repository test loads `clean-backend` and checks that its workstreams, their topology, their folders and its rubric are the ones it had before the move. `factory build backend --check` is fresh after a build.

- [x] Add the optional `core` field to the schema definition and the `core.ts` declaration (name, description, workstreams, the default of what each waits for) to `toolkit/core/types.ts`
- [x] Move the five workstream folders to `schemas/shared/cores/clean-core/workstreams/` and `schemas/clean-backend/review/RUBRIC.md` to `schemas/shared/cores/clean-core/review/RUBRIC.md`, and write `schemas/shared/cores/clean-core/core.ts`
- [x] Make `schemas/clean-backend/schema.ts` name the core `clean-core`, list no workstream of its own and keep its platform and its vetoed delivery packages
- [x] Load a schema's workstreams as the core's followed by its own, with the schema's `defaults.workstreams` merged over the core's; look a core's workstream up in the core's folder; find the rubric in the core and then in the schema
- [x] Extend the placement rule: a workstream a core lists belongs in that core's folder, a definition that names a missing core or a workstream its core lists stops the build
- [x] Make the build copy the skill and the examples of the core's workstreams as it does today, and emit the same `schema.yaml` for `clean-backend`
- [x] Add the step adapter methods of the new and modified scenarios of `repository/build`
- [x] Verify `pnpm run check` passes, `factory build backend --check` is fresh after a build and the built `schema.yaml` of `clean-backend` differs from the previous one only in the workstream name

### Phase 3: The toolkit is ready for a schema with a framework

**Tests**

The scenarios added to `architecture/linting` and to `implementer` have no step adapter and are proved by repository tests. One runs `factory check` over a scratch product with a `.tsx` file that breaks `no-environment` and expects the finding. One composes the environment rules under `node` and under `web` and compares the globals. One builds a scratch repository with two schemas that name one core, each with a workstream of its own, and checks that every layer's examples are verified with the defaults of its holder and that loading does not ask for a `schema` key.

- [x] Add the `web` platform to `toolkit/core/platform.ts` with the globals `arch-linter-poc@827d7a8` lists, and let a schema's defaults and a project configuration name it
- [x] Make the lint step take `.ts` and `.tsx` files, and give the examples' tsconfig the `jsx` setting a markup file needs to type-check
- [x] Split the repository's test run into one project per schema and per core, each loading its holder's defaults, so that the examples of a layer are verified with the defaults of whoever holds its workstream
- [x] Remove what still assumes one architecture schema in this repository: the tests that name a schema's folder or a fixed workstream, and the failure asking this repository for a `schema` key
- [x] Verify `pnpm run check` passes with the three repository tests above

### Phase 4: The backend is proved unchanged and the change is recorded

**Tests**

`factory proof` in an empty project, and `factory verify share-the-clean-core`, with `implementer` and `architecture/linting` proved by the person's word as verify-this-repository allows.

- [x] Update the README: the layout (`schemas/shared/cores/`), what a core is, how a schema names one, and the renamed workstream with a note for projects whose open plans name `clean-architecture`
- [x] Raise the package and command version to 0.4.0
- [x] Verify `pnpm run check` passes, `factory build backend --check` is fresh after a build, `factory proof` exits zero, and `factory verify share-the-clean-core --proved implementer --proved architecture/linting` records the evidence

## Feedback

- Easel session on 2026-11-15 with the person: the seven decisions listed as agreed came from there, and the person approved a synthesis that listed the rest as taken from the code or assumed.
- Built on 2026-11-15 by the agent, with the person's go-ahead to implement, verify and archive both linked changes unattended.
- Found while building (phase 2): a core's workstreams join a schema's in `loadDefinition`, so every reader of a definition (validation, `factory schemas`, the emitted `schema.yaml`, the build record) sees the core's workstreams first without knowing about cores. The placement rule reads the definitions as written, so it still tells a schema's own workstreams from its core's.
- Found while building (phase 3): a core alone has no defaults of its own; it is verified over the defaults of the nearest definition every schema naming it extends (`spec-plan` today), which is the node platform with no framework vetoed. In this repository a run picks its holder with `FACTORY_HOLDER`; with none, the first schema that builds is used, and this repository is no longer asked for a `schema` key.
- Found while building (phase 3): the reference module of a workstream gathered its upstream workstreams' examples from sibling folders; it now finds each one in the folder that holds it, so a schema's workstream can build on a core's.
- Found while building (phase 3): a configuration names a platform by its name (`platform: "web"`); a whole platform object is still accepted.
- Proved by the person's word in the evidence, and by these repository tests: `implementer` by `toolkit/architecture/graph.test.ts`, `toolkit/architecture/factory.test.ts`, `toolkit/architecture/module-rules.test.ts`, `toolkit/repository/core.test.ts` and `toolkit/core/platform.test.ts`; `architecture/linting` by `toolkit/architecture/markup.test.ts` and `toolkit/repository/holders.test.ts`.

## Next step

Build it through the implement phase, then archive it with `factory archive`. The linked change `clean-react` starts after that.

Two changes the person asked for in the same session, not part of this one:

- Probing adapters while planning. When the questions of the plan phase show that a change will use external resources, the plan phase checks each one then (the key is present, how to authenticate, that a call answers) and writes its procedure, so that after the person approves the plan nothing interrupts them until the change is built. The person called it very important: what most often stops an agent mid-build is a missing key or a doubt about how to authenticate with an API. It changes the shared plan phase, for every schema.
- End-to-end tests of the React layer with `github.com/e2e-inc/e2e`, with the adapters or the core replaced by doubles, once the procedure for mounting a product locally exists.
