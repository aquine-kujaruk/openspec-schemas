---
name: clean-react
description: A schema for a React frontend on the clean core, with the workstreams react-ui and react-hooks, its rubric rows and the packages frontend and fullstack
created_at: 2026-11-15
created_by: the person
schema: spec-plan
---

# Clean React

## Goal

A project can build a React frontend with Clean Architecture: the schema `clean-react` names the core `clean-core` and adds two workstreams, `react-ui` (the pages, the components, the bridges and the entry) and `react-hooks` (controllers, queries, mutations, view-models and stores), which is the glue between what is shown and the API behind the core. The rules, examples and specs of both layers come from `arch-linter-poc@827d7a8`, where they were already agreed. Two new packages carry it: `frontend` for a project that is only a frontend, and `fullstack` for a repository with a backend and a frontend declared as products.

It starts once the linked change `share-the-clean-core` is archived: it needs the core, the renamed `modules` workstream, the `web` platform and the checking of files that carry markup.

## Decisions

Agreed with the person in the Easel session of 2026-11-15:

- The schema is called `clean-react`: its core and what it adds. Discarded: `clean-frontend`, the provisional name the living specs used, and `react` alone.
- Packages: `frontend` lists `clean-react` and `spec-plan`; `fullstack` lists `clean-backend`, `clean-react` and `spec-plan`; `backend` stays. Discarded: `frontend` alone (a repository with an API and a web application could not install both schemas), and one package with everything (a backend-only project would carry the React skills).
- The two skills the React workstreams read, `composition-patterns` and `web-design-guidelines` of `vercel-labs/agent-skills` at commit `1a2c79d4e6c4a2283dc2c614b6538cbe1ed5ca62`, are declared in the manifest by repository and commit for the agent package manager to install. Discarded: copying them into the schema with a lock file, as the source did, which the decision `declare-do-not-carry` forbids; and leaving them out.
- The first version prescribes no product test for the React layer: it is held by its rules, the type checker and the rubric, as in the source. The person would test it end to end with `github.com/e2e-inc/e2e`, with the adapters or the core replaced by doubles, "una vez que ya se sepa el runbook y cómo se monta en local". That is a later change. Discarded for now: one render per component, and `renderHook` over an in-memory adapter.
- The reference module is ported as it is: it reads data (two queries, a controller, a view-model, a page and the entry). A mutation, a store and a bridge in the reference wait for a later change. Discarded: completing it here, which would be new doctrine and not an extraction.
- Probing adapters during the plan phase is a change of its own, after this one, and the person called it very important (see Next step).

Taken from the source and from the code, and shown to the person in the approved synthesis:

- The rules, the examples and the two layer specs are imported from `arch-linter-poc@827d7a8` and not proposed again, as `bootstrap-clean-backend` did (`design.md:219-230`). Paths and command names are reworded (`factory expect`, `factory check --workstream`), nothing else.
- `react-hooks` waits for `react-ui`; `integrate` waits for `modules` and for `react-hooks`; the three map workstreams of the core and `react-ui` run in parallel (`.factory/implementer/config.ts:50-58` of the source). The seam between the two is the controller: `react-ui` writes each one as a stub that returns literal data, and `react-hooks` replaces its body keeping its shape (split-react-workstream D3).
- The entry (`src/main.tsx`: providers, bridges and routing) is written by `react-ui`, and the composition root is in the queries and mutations: each one does `new XUseCase(new XRepositoryImplementation(xAdapter))` once (split-react-workstream D5; clean-arch-doctrine D1). The entry zone and its boundary stay declared by the core's `modules` layer; the `ui` rules reach the entry files through the configured `entry` patterns.
- Defaults of the schema: platform `web`; entry `src/*.tsx` and `src/*.ts`; `react`, `react-dom`, `react-router-dom`, `@tanstack/react-query` and `zustand` vetoed in the core, and in infrastructure too except `zustand/vanilla` (`.factory/implementer/config.ts:19-35` of the source); `index.html` allowed outside every zone.
- The schema prescribes no router library. Routing lives in a bridge and in the entry, as the source does by hand.
- The rubric rows S01 to S04 (business logic in a controller, store against query cache, the controller's surface, view-models and forms), which the backend import dropped as React's, are the rows `clean-react` adds, in `schemas/clean-react/review/RUBRIC.md`.

Assumptions of mine, not agreed one by one:

- `no-hooks` (no function named `use<Something>` in domain, application or infrastructure), which the backend import dropped from the core's layers, returns as a rule of the `framework` layer, owned by `react-hooks`, with one example case. The shared core keeps no rule about hooks. Discarded: putting it back in the core's layers, which would make the core speak of a framework.
- The React clauses the backend import cut from core rows return as rows of `clean-react` with new ids after the core's last one: a query that hydrates with `select` when no use case stands between (from S05 and S19), and a view-model is not a DTO and only decides variations of the canonical format (from S06 and S15). The core's rows are not edited. The clause of S07 about rendering each component once is not imported, since no product test is prescribed.
- Scaffolds, by the decision `scaffold-first`: the query (`<name>.query.ts`, with its key factory and its composition root), the stub controller (`<name>.controller.ts`) and the page (`<name>.page.tsx`). Controllers once real, view-models, stores, mutations, components and bridges are mostly logic and get none.
- The two layer specs name React and the query library where the source does. The rule of this repository's specs is that a spec speaks the vocabulary of its capability, and here the capability is that framework's layer.
- The workstream skills keep the source's text with this repository's commands. Where the source said to mount the application with its own toolchain, the skill says to use the project's own command: the schema prescribes no bundler.
- The manifest's `skills` accepts a second shape, `{ repository, commit, path }`, next to `{ tool, path }`.
- The language server entry of both new packages also maps `.tsx`.
- `factory proof` for a package whose default schema adds workstreams installs in the scratch project the packages the reference module imports, checks every workstream of the schema and type-checks the result.
- `fullstack` is proved as products-per-folder was: a scripted session on a test project with `apps/api` on `clean-backend` and `apps/web` on `clean-react`, with two linked changes.
- The shared implement skill stops saying that the entry belongs to one named workstream and says that it belongs to the workstream whose skill owns it.
- Version 0.5.0 for the package and the command: a schema and two packages are added, and the manifest gains a shape.

## Open questions

## Architecture decisions

## Procedures

## Phases

### Phase 1: clean-react checks a React module

**Tests**

The generated tests of the new specs `architecture/ui` and `architecture/framework`: every case of both example files compared with its recorded expectation, and the reference module breaking no rule, verified with `clean-react`'s defaults. The scenarios added to `implementer` have no step adapter and are proved by `toolkit/architecture/graph.test.ts` loading `clean-react`. `toolkit/architecture/rule-ids.test.ts` finds every slug of both specs in the rules and the reverse. `toolkit/architecture/scaffolds.test.ts` renders the three new scaffolds into files the two layers accept.

- [x] Write `schemas/clean-react/schema.ts`: it extends `spec-plan`, names the core `clean-core`, adds the workstreams `react-ui` and `react-hooks`, and sets the defaults listed under Decisions and the topology
- [x] Port `react-ui` from the source (`ui.rules.ts`, `ui.examples.md`, `ui.feature.steps.ts`, `workstream.ts`, `SKILL.md`) onto this repository's toolkit, with the commands reworded
- [x] Port `react-hooks` from the source (`framework.rules.ts`, `framework.examples.md`, `framework.feature.steps.ts`, `workstream.ts`, `SKILL.md`) the same way, and add the rule `no-hooks` with its case `core-exports-a-hook`
- [x] Add the `## scaffolds` sections: the query in `framework.examples.md`, the stub controller and the page in `ui.examples.md`, and make each skill's first step for those kinds the render command
- [x] Record every case's expectation with `factory expect` and generate the tests of both specs
- [x] Reword the entry's sentence in `schemas/shared/phases/implement/SKILL.md`
- [x] Verify `pnpm run check` passes

### Phase 2: review asks the React rows

**Tests**

The generated tests of the requirement added to `architecture/review`. `toolkit/architecture/review/rubric.test.ts` parses both rubrics and rejects a row id present in the two.

- [x] Write `schemas/clean-react/review/RUBRIC.md` with the rows S01 to S04 of the source and the two rows described under Decisions, each as a yes/no question with its layers
- [x] Make review ask the core's rows and then the schema's, and reject a row id that both rubrics carry
- [x] Add the step adapter methods of the new scenarios of `architecture/review`
- [x] Verify `pnpm run check` passes

### Phase 3: the packages frontend and fullstack build

**Tests**

The generated tests of the requirement added to `repository/build`: a skill taken from a repository at a commit is declared and not copied, and one with no commit stops the build. `factory build frontend --check` and `factory build fullstack --check` are fresh after a build, and `factory build backend --check` still is.

- [x] Let the manifest's `skills` take `{ repository, commit, path }` and make the build declare it for the agent package manager, failing when the commit is missing
- [x] Write `packages/frontend.ts` (`clean-react`, `spec-plan`) and `packages/fullstack.ts` (`clean-backend`, `clean-react`, `spec-plan`), with the tools `backend` pins, the two skills of `vercel-labs/agent-skills` at the agreed commit, and `.tsx` in the language server
- [x] Add the step adapter methods of the new scenarios of `repository/build`
- [x] Verify `pnpm run check` passes and the three packages build fresh

### Phase 4: a React product and a fullstack repository are proved

**Tests**

`factory proof` for `frontend` in an empty project: the reference module of the seven workstreams is written out, its rules hold, it type-checks, and the core's acceptance and integration tests pass. A scripted session on a test project that installs `fullstack` and declares `apps/api` on `clean-backend` and `apps/web` on `clean-react`: `factory schemas` lists both products, two linked changes validate ready, `factory check --product web` reports a React rule broken in `apps/web` and `factory check --product api` does not.

- [x] Extend `factory proof` as described under Decisions and run it for `frontend`
- [x] Run the fullstack session and record what it proved, and what it did not, under Feedback
- [x] Update the README: the schema, its two workstreams, the two packages and the fullstack case
- [x] Raise the package and command version to 0.5.0
- [x] Verify `pnpm run check` passes, the three packages build fresh, `factory proof` exits zero for `backend` and for `frontend`, and `factory verify clean-react --proved implementer --proved flow/plan` records the evidence

## Feedback

- The open question on the linked change was answered by the archive itself: `share-the-clean-core` was archived on 2026-11-15 as planned (a schema names its core in a `core` field, the `web` platform, the workstream `modules`, markup files checked, each holder verified with its own defaults). Nothing in this plan or its delta specs needed correcting.
- Easel session on 2026-11-15 with the person: the six decisions listed as agreed came from there, and the person approved a synthesis that listed the rest as taken from the source or assumed.

- Built on 2026-11-15 by the agent, with the person's go-ahead to implement, verify and archive both linked changes unattended.
- Found while building (phase 1): every rule, example and recorded expectation of `react-ui` and `react-hooks` came over from the source unchanged; recording them again with `factory expect` gave the same findings file by file. Only the entry zone stayed out of `ui.rules.ts`: the core's `modules` layer already declares it, and the `ui` rules reach the entry through the configured `entry` patterns.
- Found while building (phase 1): the query scaffold composes its use case over a repository implementation and an adapter named after a resource, not after the use case, so it takes three more placeholders (`Resource`, `resource`, `resourceCamel`) beside `Name`, `name` and `camel`. The stub controller returns one literal field the page scaffold paints, so neither file is empty.
- Found while building (phase 1): with two schemas that build product code, the clean core verified alone no longer took the backend's vetoed packages, and its `no-framework-import` counterexamples stopped breaking. The core now declares, for its own examples only, the stand-in framework they import (`examples` in `core.ts`); it vetoes nothing in a product.
- Found while building (phase 1): the tests that compare rule slugs and case names with the layer specs read the specs as ready changes leave them, as generation does, so a layer a change adds is held to its spec before the archive.
- Found while building (phase 1): the scratch projects of this repository's tests name `schema: "clean-backend"` in their `factory.config.ts`. This repository now defines two schemas that build product code, like a `fullstack` package, and a project in that case must say which one it uses: the rule of products-per-folder, which stays as it was.
- Found while building (phase 2): a core's rows S05 and S17 are rejected under this repository's own vocabulary (they name `return`), as before this change; the review skips them here and asks them in a product whose vocabulary allows them.
- Found while building (phase 4): `factory proof frontend` type-checks the reference module of `react-ui` and `react-hooks` and what it imports. The references of the core were never type-checked and do not type-check whole (a stand-in parser in an HTTP adapter example), so the core's references stay proved by their rules and tests.
- Phase 4 session on 2026-11-15, run by the agent with the real commands on a test project (package `fullstack` 0.5.0 put where APM would install it, since APM is not on the path; `apps/api` on `clean-backend`, `apps/web` on `clean-react`). It was a scripted run, not an agent planning and building from a prompt. It proved the following:
  - `factory schemas` listed both products with their schemas.
  - Two linked changes, one per product, validated ready. Breaking a link back, making the web change with the backend's schema, and naming `react-ui` in a task of the api change each made a change not ready, with the finding naming the fix.
  - With a page that imports a query and counts in its markup, and a query that bridges no use case, in `apps/web`: `factory check --product web` reported the boundary `framework-ui → framework-queries` (`ui-reaches-core-through-controllers`), `jsx-neither-compares-nor-counts` and `query-bridges-use-case`. `factory check --product api` named no file of `apps/web`; it failed only on its own unwritten acceptance step adapter.
- Found in that session, not fixed here: in a project with no `tsconfig.json` at all, the tsconfig the command composes lives in its cache folder, and archunit then sees no file of the project (it reads files relative to the tsconfig's folder), for `.ts` and `.tsx` alike. A project with its own `tsconfig.json`, as every TypeScript project has, is checked in full. It belongs to a change of its own.
- Proved by the person's word in the evidence, and by these repository tests: `implementer` by `toolkit/repository/core.test.ts` (the topology of `clean-react` and the owner of each of its layers); `flow/plan` only replaces the provisional name `clean-frontend` with `clean-react` in one Examples row.
- Not proved there: an agent planning one intention into a backend and a frontend change from a prompt, and building a screen through `react-ui` then `react-hooks`.

## Next step

Build it through the implement phase once `share-the-clean-core` is archived, then archive it with `factory archive`.

Three changes follow, in the order the person gave them weight:

- Probing adapters while planning. When the questions of the plan phase show that a change will use external resources, the plan phase checks each one then (the key is present, how to authenticate, that a call answers) and writes its procedure. The person's reason: "una vez yo apruebe el plan, hasta que no estén todos los cambios, no se me debería interrumpir más […] lo que más me encuentro que puede faltar es o una clave, o hay dudas de cómo autenticarse con qué API […] Y escribir el runbook, para que la próxima vez ya no tenga que preguntar eso". It changes the shared plan phase, for every schema.
- End-to-end tests of the React layer with `github.com/e2e-inc/e2e`, once the procedure for mounting a product locally exists.
- A reference module that also writes: a mutation, a store and a bridge, with the decisions that brings (cache invalidation, what a store keeps, routing).
