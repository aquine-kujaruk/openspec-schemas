---
name: one-react-workstream
description: clean-react builds its framework through one workstream, react, that owns the ui and framework layers, builds the screens against stub controllers and later replaces them with the real ones over the core's seams
created_at: 2026-11-21
created_by: the person
approved_at: 2026-11-21
schema: spec-plan
---

# One React workstream

## Goal

`clean-react` adds one workstream to the clean core instead of two: `react` owns the `ui` and `framework` layers, with the rules, examples, scores and skill of both. In the first phase that touches the screens it builds each page from its approved spike against stub controllers and writes the end-to-end tests. In a later phase, once the core's seams are signed, it replaces each stub's body with the real queries, mutations, stores and view-models, and keeps the same tests passing. The controller a page destructures is no longer a seam between two workstreams. The use-case signatures and the adapter instances the framework composes are the seams.

## Findings

- `clean-react` names the workstreams `react-ui` and `react-hooks`. `react-ui` depends on nothing and `react-hooks` depends on `react-ui`. `spike` is `{ workstream: "react-ui" }`. The phases instruction says "the controller each page destructures is one" seam (`schemas/clean-react/schema.ts:14,31-46` @8f12093, seen 2026-11-21).
- A workstream may declare several layers: `app-domain` declares `[acceptance, domain, application, unit]` (`schemas/shared/cores/clean-core/workstreams/app-domain/workstream.ts:9` @8f12093, seen 2026-11-21).
- Rules, examples and scores are found per layer inside a workstream folder (`<dir>/<layer>.examples.md`, `<layer>.scores.json`; `factory/quality.ts:149,270`, `rubric-case.adapter.ts:63` @8f12093, seen 2026-11-21). `ui.*` and `framework.*` can therefore live together in one folder.
- `react-ui` owns `ui` (pages, components, bridges, the entry) and writes the stub controllers. `react-hooks` owns `framework` (controllers, queries, mutations, view-models, stores) and its check runs `factory test e2e` (`schemas/clean-react/workstreams/*/SKILL.md` @8f12093, seen 2026-11-21).
- The implement phase writes every seam a phase declares, signed as the plan signs it, before the phase's first workstream starts (`openspec/specs/flow/implement/spec.md:80` @8f12093, seen 2026-11-21).
- `react-ui` and `react-hooks` are named in `implementer`, `flow/implement`, `repository/build` and `factory/quality/inspect-work-order` (specs). They are also named in `test/schemas/core.test.ts`, the step adapter `test/acceptance/quality/inspect-work-order.feature.steps.ts:160`, `RUBRIC.md` S23, the `modules` skill, `CONTRIBUTING.md` and `docs/flow.md` (`grep -rln 'react-ui\|react-hooks'`, seen 2026-11-21). `flow/plan-validation` and `test/schemas/holders.test.ts` use `react-ui` only as a name a core-only schema lacks, or as a synthetic fixture.
- The package and the command are at 0.14.3 (`package.json` @8f12093, seen 2026-11-21).
- `factory doctor` in this source repository prints "no installed package found". CONTRIBUTING's source workflow applies instead (seen 2026-11-21).

## Decisions

- One workstream for the whole framework, named `react`, owning `ui` and `framework`. Discarded: keeping `react-ui | react-hooks` with the controller as their seam. The person: "no quisiera entonces la parte de UI y la parte de hooks sea dos workstream diferentes […] que sea simplemente un workstream ya con su regla". @by:person
- `react` depends on nothing and may run beside the core's map workstreams. Its stubs are replaced in a later phase than the one that builds the screens, against the seams that phase signs. Discarded: making `react` wait for the core, which would delay the screens until the core is built. @by:person
- No workstream joins `react` with the core. The join is the composition line in each query and mutation (`new XUseCase(new XRepositoryImplementation(xAdapter))`), written against the signed seams, and verify runs every check and the end-to-end tests. Discarded: bringing back an integrating workstream, which `e2e-and-spikes-for-the-web` removed. @by:person
- `react`'s own check is its rules and the type check. The end-to-end tests are run with `factory test e2e` at the end of each phase that touches the screens and at verify. They are not part of the workstream check, because halfway through a phase the core's bodies may not exist yet. Discarded: keeping `factory test e2e` in the workstream check, as `react-hooks` had. @by:agent
- In the phase that replaces the stubs, `react`'s task is listed after the core's tasks, so its end-to-end tests run over a built core. Discarded: a dependency inside the topology, which would hold the screens too. @by:agent
- The skill keeps the substance of both skills, in two parts: "Screens, against stubs" (what `react-ui` did) and "Controllers, over the core" (what `react-hooks` did). The declared skill `composition-patterns` is read whole. Discarded: two skills in one folder. @by:agent
- `flow/plan-validation` and `test/schemas/holders.test.ts` keep `react-ui`: there it is only a name the schema under test lacks, or a synthetic fixture, so nothing about them changes. @by:agent
- This repository's own change, opened with `spec-plan` (CONTRIBUTING). @by:agent
- Version 0.15.0: the packages carry a renamed workstream, so an installed `frontend` or `fullstack` sees `react` in place of `react-ui` and `react-hooks`. @by:agent

## Open questions

## Architecture decisions

### Decision: one-framework-workstream · A schema's framework is one workstream

@adds @area:product @topic:schemas @applies:schemas,phases @enforced:build-spec,implementer-spec @by:person

A schema that adds a framework to its core SHALL add it as one workstream that owns every layer of the framework. In a web schema that workstream SHALL be the spike workstream. It SHALL build the screens of a change against stub controllers in the first phase that touches them, and it SHALL replace those stubs with the real controllers in a phase whose seams sign the use cases and adapters they compose. The controller a page destructures SHALL NOT be a seam between workstreams.

**Why** The person wants the screen and the logic behind it built by the same hands, with one rule set. The stub is a step inside the framework's work, not a frontier, and the frontier that matters is the one with the core.

**Alternatives** Two workstreams split at the controller (`react-ui | react-hooks`), discarded by the person. A framework workstream that waits for the core, discarded because the screens would come after the core.

**Consequences** The phases instruction of a web schema no longer lists the controller as a seam. The framework workstream has tasks in two phases. Its stubs must survive until the phase that replaces them, and the end-to-end tests are its proof at each phase's close.

### Decision: spike-while-planning · A web change is spiked as throwaway HTML while planning and tested end to end while implementing

@modifies:spike-while-planning @base:2026-11-17-throwaway-spikes @area:product @topic:flow @applies:phases,schemas,toolkit @enforced:screen-approved @by:person

A schema whose platform is `web` SHALL declare a spike workstream. The plan of a change that touches what a user sees SHALL spike its screens as self-contained HTML files under the change's `spikes/` folder, SHALL get each screen approved by whoever can decide it (`@approved`), and SHALL write the journeys through it in plain words; it SHALL NOT write the product's code. The spike workstream SHALL build those screens first, from the approved spikes and against stub controllers, and SHALL write the end-to-end tests of their journeys. When it later replaces its stubs with the real controllers over the core, the same tests SHALL keep passing, the doubles sitting at the adapters.

**Why** The person saw the screens only at the end of the implementation, when changing them is expensive. Building the spike in the product asked the planner for a product that may not exist yet, with its framework and tools installed and a way to run it, and opened the product to a change not yet approved. A throwaway page costs an agent little; a plan coupled to the product costs a lot.

**Alternatives** The spike in the product's framework, where it stays, reused by the implementation, discarded by the person as "dejarle mucho al planificador". End-to-end tests recorded against the HTML, discarded because they bring the tooling back to the plan and check a page that is thrown away.

**Consequences** The approved screen is a mockup, not the product's pixels: the spike copies the product's look when it has one, and the real screen is seen at verify. The guard opens no product path while planning. The spike workstream is also the one that replaces its stubs, so the tests it writes are the tests it keeps.

## Procedures

## Screens

## Phases

### Phase 1: clean-react builds its framework through one workstream

**Tests**

The scenarios of `implementer` have no step adapter and are proved by `test/schemas/core.test.ts`: `react` depends on nothing and may run beside `app-domain`, `infrastructure`, `adapters` and `modules`; `ui` and `framework` belong to `react`. The generated test of `repository/build` (`tools/build.feature.test.ts`): `clean-react` builds through `app-domain, infrastructure, adapters, modules, react`. The generated test of `factory/quality/inspect-work-order`: a whole-product finding in `framework/ui` is raised on `react`. `flow/implement` is proved by the person's word.

- [x] Move `schemas/clean-react/workstreams/react-ui/*` and `react-hooks/*` into `schemas/clean-react/workstreams/react/` with `git mv`, keeping the per-layer files (`ui.*`, `framework.*`). Write one `workstream.ts` declaring `layers: (o) => [ui(o), framework(o)]`. Remove the old folders.
- [x] In `schemas/clean-react/schema.ts`: `workstreams: ["react"]`, `spike: { workstream: "react" }`, `defaults.workstreams: { react: { dependsOn: [] } }`. Reword the doc comment. Rewrite `PHASES` so the seams of a phase that replaces stubs are the use-case signatures and adapter instances the framework composes, and the controller is not a seam.
- [x] Write `workstreams/react/SKILL.md` from both skills: Owns (both layers' folders and the entry), Receives (screens with spikes and journeys, then the signed use cases and adapters), Fakes (the controller, until the phase that replaces it), "Screens, against stubs" and "Controllers, over the core", end to end, declared skills, Check (`factory check --workstream react` and the type check; `factory test e2e` at each phase's close).
- [x] Rename `react-ui` and `react-hooks` to `react` in the implement and plan skills where they name them, `RUBRIC.md` S23, the `modules` skill, `CONTRIBUTING.md`, `docs/flow.md`, the README if it names them, and the step adapter `test/acceptance/quality/inspect-work-order.feature.steps.ts`. Update `test/schemas/core.test.ts` to the new topology and owners.
- [x] Regenerate the generated tests of the changed specs with `pnpm exec factory generate`. Raise the package and command version to 0.15.0.
- [x] Verify `pnpm run check` passes, `factory build frontend --check` and `factory build fullstack --check` are fresh after a build, and `factory verify one-react-workstream --proved flow/implement --proved implementer` records the evidence.

## Feedback

- Built on 2026-11-21 by the agent, at the person's request ("Sí, apruébalo e implementa").
- Found while building: the scenario name of `flow/implement` cannot be renamed by a MODIFIED block, so the journey scenario keeps its `<workstream>` column, valued with the two parts of `react`.
- Found while building: `plan-validation.feature.steps.ts` writes a `clean-react` plan with a `react-ui:` task for the screen scenarios; it now writes `react:`. Its spec is unchanged, since its rows name no workstream of `clean-react`.
- Found while building: `test/integration/production/stage-start-repository.test.ts` (keeps a spec-plan stage open) fails in this checkout whenever the untracked `.env` is present, on `main` too, and passes without it; it is unrelated to this change.

## Next step

Build phase 1 through the implement phase, then verify and archive the change.
