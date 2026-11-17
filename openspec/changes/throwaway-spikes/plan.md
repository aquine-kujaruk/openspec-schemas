---
name: throwaway-spikes
description: A web change is spiked while planning as throwaway HTML in the change's spikes folder, the plan writes no product code, and the spike workstream builds the approved screens and writes their end-to-end tests while implementing
created_at: 2026-11-17
created_by: the person
schema: spec-plan
---

# Throwaway spikes

## Goal

The person still sees and corrects the screens of a web change while it is planned, but the plan no longer writes the product: each spike is a self-contained HTML file under `openspec/changes/<change>/spikes/`, opened with a double click, thrown away with the change, and offering variants when the screen is the person's call. A product with no source yet, no framework installed and no `local-run` is spiked like any other. The end-to-end tests move to the implementation: the spike workstream (for `clean-react`, `react-ui`) is the first to build the screens, from the approved spikes, and writes the tests from the journeys each screen lists; the later workstreams keep them passing, as today.

## Findings

- The plan skill builds the spike workstream in `src` against stub controllers, mounts the product with `local-run`, writes the end-to-end tests and runs `factory test e2e` while planning, and writes that workstream's tasks already ticked (`schemas/shared/phases/plan/SKILL.md`, steps 10-11 @695e2b7, seen 2026-11-17).
- The guard opens, to an active change not in implementation, the zones of its schema's spike workstream, the files `spike.fakes` names and the entry (`toolkit/package/guard.ts:100-132,164` @695e2b7, seen 2026-11-17); `spike.fakes` is read nowhere else (`grep -rn fakes toolkit schemas`, seen 2026-11-17).
- `openspec/changes/<change>/` is neither harness nor product: the guard lets an agent write it in any phase (`toolkit/package/guard.ts:40-70` @695e2b7, seen 2026-11-17).
- Validation's `screen-approved` checks `@approved` and `@page` on each screen, and asks for a screen when the plan has a task of the spike workstream (`schemas/spec-plan/validators/standard/validator.ts:169-200` @695e2b7, seen 2026-11-17).
- The implement skill treats ticked tasks as the spike the plan built and starts at the next workstream (`schemas/shared/phases/implement/SKILL.md`, step 7 @695e2b7, seen 2026-11-17).
- Every file under `schemas/shared/phases/<phase>/` is copied into the package, so a phase skill can carry a `references/` file (`toolkit/repository/build.ts:230-231` @695e2b7, seen 2026-11-17).
- `the-reference-writes` added to the requirement of `flow/plan` this change removes the scenario of a stub that keeps a write in local state, and added rubric row S23 and the decision `page-store`, both of which call the stub controller "of the spike" (`openspec/specs/flow/plan/spec.md`, `openspec/adr/product/implementer.md`, `schemas/clean-react/review/RUBRIC.md` @82521bc, seen 2026-11-17).
- The skill `prototype` (github.com/mattpocock/skills, `skills/engineering/prototype` @3216582, seen 2026-11-17): its UI branch mounts several structurally different variants (3 by default, at most 5) on the product's real route behind `?variant=` and a floating bar, and prefers the existing page over an isolated one, since "every variant looks fine in isolation"; its logic branch is one self-contained HTML file with free-play buttons, guided walkthroughs as tabs that reset to a known state, labels in domain language and the question stated at the top; both end by committing the prototype to a throwaway branch linked from an issue. The copy installed in `~/.agents/skills/prototype` is older: its logic branch is still a terminal app.
- The package and the command are at 0.9.0 (`package.json` @82521bc, seen 2026-11-17).

## Decisions

Asked by the person in the conversation of 2026-11-17:

- The spike is a throwaway HTML file in the change, not code in the product. The person: "los spikes deberían ser un archivo HTML, ahí mismo en los cambios. Debería ser algún artefacto generado, pero un artefacto de estos tipo desechable [...] una carpeta spikes y pueden haber diferentes spikes [...] un prototipo rápido con HTML o un mockup [...] Lo ideal es que emulara lo que se va a crear después". It overturns the decision of `e2e-and-spikes-for-the-web` to build the spike where it stays.
- The plan writes no product code. The person: "escribir desde la planificación en el código, cuando el código, por ejemplo, puede que ni exista, ni tenga las herramientas necesarias, incluso puede que ni [React] esté instalado, es dejarle mucho al planificador". The guard stops opening the spike workstream's paths to a change being planned.
- The end-to-end tests are written while implementing. The person: "Lo de [e2e] lo veo bien, pero sería ya para la implementación".
- `the-reference-writes` and `suspect-runbooks` were committed and archived before this change went ready. The person: "Sí, comitéa y archiva los dos primero". Committed as `8fb69d1` and `287f951`, archived as `9ff9378` and `82521bc`.

Proposed by the agent in the same conversation and accepted by the person ("Oka, entonces vas a hacer [...] un cambio para esto"):

- The end-to-end tests are not run against the spike: that would bring back to the plan the tooling the person wants out of it, and record locators against a page that is thrown away. The journeys travel in plain words, and `agent.act` takes them almost literally. Discarded: e2e "visual only" against the HTML.
- The skill `prototype` is not invoked: its UI branch builds in the product's route and framework, which is what this change discards, and it closes on a git branch and an issue. Its pieces go into the plan's own instructions: the question at the top, structurally different variants behind a floating bar, the journeys as tabs that reset to a known state, labels in domain language, one file with no framework or server. Discarded: declaring it as a skill the package installs.
- The spike workstream is the first the implementation builds and its tasks are no longer ticked while planning: it builds each screen from its approved spike against stub controllers and writes the end-to-end tests there, so "the tests pass before any logic exists" still holds, one workstream later.
- A spike reuses the product's look when the product has one: its stylesheet or tokens and its shell (header, navigation) are copied inline, so the screen is judged against the rest of the app and not in a vacuum. The pixel-exact screen is seen at verify.

Taken from the code and conventions:

- This repository's own change, opened with `spec-plan` (`README.md`, Work on this repository).
- A schema keeps declaring `spike: { workstream }`; its meaning becomes the workstream that builds the approved spikes first. `fakes` goes away: only the guard read it.
- A screen gains `@spike:<path>`, relative to the change, which validation requires to be an existing file under `spikes/`; `@page` stays as the page the implementation builds.
- The local-run procedure is still the plan's when the runbooks lack it (purpose `setup`, not probed, since the product may not run yet); verify executes it, and the spike workstream writes `e2e.config.ts` from it in the first web change of a product.
- The data a spike paints stays the seed of the in-memory adapters of the `e2e` environment.
- The archive moves the change folder whole, so the spikes are kept with it as history and never reach the product.
- `flow/plan` and `flow/implement` have no step adapter: proved with `--proved`.
- Version 0.10.0: the plan and implement skills, validation, the guard and the `react-ui` skill the packages carry change.

Assumptions of mine, not agreed one by one:

- A spike answers one question and may hold several screens, navigable inside the file, so a journey that crosses screens (list, then detail) can be walked; a screen names the spike that holds it, and two screens may name the same one.
- The variant is chosen with a `?variant=` search parameter or the URL's hash, both of which work on a `file://` page; the floating bar cycles them.
- Once the person approves a variant, the spike keeps only that one, so the implementation reads a single screen; the plan says under the screen which variant it was.
- The instructions for writing a spike live in `schemas/shared/phases/plan/references/spike.md`; the plan skill's step points to it.
- The journeys are written under each screen block as a numbered list of plain-language steps, each ending with what the screen shows afterwards.

## Open questions


## Architecture decisions

### Decision: spike-while-planning · A web change is spiked as throwaway HTML while planning and tested end to end while implementing

@modifies:spike-while-planning @base:2026-11-16-e2e-and-spikes-for-the-web @area:product @topic:flow @applies:phases,schemas,toolkit @enforced:screen-approved

A schema whose platform is `web` SHALL declare a spike workstream. The plan of a change that touches what a user sees SHALL spike its screens as self-contained HTML files under the change's `spikes/` folder, SHALL get each screen approved by whoever can decide it (`@approved`), and SHALL write the journeys through it in plain words; it SHALL NOT write the product's code. The spike workstream SHALL be the first the implementation builds for those screens, from the approved spikes and against stub controllers, and SHALL write the end-to-end tests of their journeys; the later workstreams SHALL keep them passing with the real code behind the screens, the doubles sitting at the adapters.

**Why** The person saw the screens only at the end of the implementation, when changing them is expensive. Building the spike in the product asked the planner for a product that may not exist yet, with its framework and tools installed and a way to run it, and opened the product to a change not yet approved. A throwaway page costs an agent little; a plan coupled to the product costs a lot.

**Alternatives** The spike in the product's framework, where it stays, reused by the implementation (the previous version of this decision), discarded by the person as "dejarle mucho al planificador". End-to-end tests recorded against the HTML, discarded because they bring the tooling back to the plan and check a page that is thrown away. The skill `prototype` as it is, discarded because its UI branch builds in the product.

**Consequences** The approved screen is a mockup, not the product's pixels: the spike copies the product's look when it has one, and the real screen is seen at verify. The guard opens no product path while planning. `react-ui` gains the end-to-end tests and the first configuration of the tool.

### Decision: page-store · The state of a page lives in its store

@modifies:page-store @base:2026-11-17-the-reference-writes @area:product @topic:implementer @applies:schemas @enforced:review

In a schema whose framework layer has stores, every state that changes on a URL page SHALL live in that page's store, one store per page named after it, and what comes from a fetch or a mutation SHALL live in the query cache, never in a store. Once implemented, pages, components and controllers SHALL NOT keep such state in local component state where the page's store can hold it. A stub controller the spike workstream writes, before the real one replaces it, is the exception: it keeps its literal data in local state, with no store and no query cache.

**Why** The person: "las stores son por página, pero por página de URL [...] para guardar todos esos estados que van cambiando, ni tener useReducer ni nada de eso, para lo que se usa un store". A page's state then survives its components and the page's own unmount, and one file per page says where to look for it. The stub stays the minimum that passes the end-to-end tests.

**Alternatives** Local state for a one-component draft, as S02 said, discarded by the person. A lint rule on `framework/ui`, discarded because the person wants it avoided "si se puede", which leaves room for a justified exception that a reviewer judges.

**Consequences** S23 asks the question in `factory review`. Even a dropdown's open state belongs in the page store unless the reviewer accepts the exception. A rule never catches it: it is found at verify. Only the wording of the exception changes here: the spike is no longer code, so the exempt stub is the one the spike workstream writes while implementing.

## Procedures

## Screens

## Phases

### Phase 1: the plan spikes in the change and writes no product code

**Tests**

The generated tests of `flow/plan-validation`: each row of the modified screen requirement, a screen whose `@spike` is missing, unnamed or outside the change reported not ready. The generated tests of `package/write-guard` no longer hold the removed rule, and its other rules still pass; `toolkit/package/guard.test.ts` keeps passing with no spike opening. `flow/plan` is proved by the person's word.

- [x] Require `@spike` on each screen in `screen-approved`: a path relative to the change, under `spikes/`, ending in `.html`, that exists; and add the step `screenSpike` to `plan-validation.feature.steps.ts`
- [x] Remove `spikeOpenings` from the guard, `fakes` from `SchemaDefinition.spike` and from `clean-react`'s schema, and the spike rule's steps from `write-guard.feature.steps.ts`; reword the comments of `spike` in `toolkit/core/types.ts`, `toolkit/flow/validation.ts` and `schemas/clean-react/schema.ts`
- [x] Change the line `factory schemas` prints for a spike workstream from "built while planning" to say it builds the approved spikes first
- [x] Write `schemas/shared/phases/plan/references/spike.md`: the question at the top; one self-contained file per question, no framework, build or server, opened with a double click; the product's stylesheet, tokens and shell copied inline when it has them; labels and data in the product's words, the data being the seed of the in-memory adapters; one variant when a convention or a standing screen settles it, otherwise 3 structurally different ones (at most 5) behind a floating bar driven by `?variant=` or the hash; the journeys as tabs that reset to a known state, each step a real control; once approved, only the approved variant stays
- [x] Rewrite steps 10 and 11 of the plan skill: spike the screens under `spikes/` following `references/spike.md`, list each screen with `@page`, `@spike` and its journeys in plain words, approve or ask, write the local-run procedure when the runbooks lack it without running it, and write no product code and no end-to-end test
- [x] Rewrite the Screens paragraph of the plan's instruction in `schemas/spec-plan/schema.ts` and the comment of `## Screens` in `schemas/spec-plan/templates/plan.md`
- [x] Verify `pnpm run check` passes and `factory build backend --check`, `factory build frontend --check` and `factory build fullstack --check` are fresh after a build

### Phase 2: the spike workstream builds the approved screens and tests them end to end

**Tests**

`flow/implement` is proved by the person's word. `toolkit/architecture/review/rubric.test.ts` keeps parsing `clean-react`'s rubric. The three packages build fresh.

- [x] Rewrite step 7 of the implement skill: no task arrives ticked; the spike workstream is built first, from each screen's approved spike, and writes the end-to-end tests of the journeys under `test/e2e/<module>/`, which later workstreams keep passing with `pnpm exec factory test e2e`
- [x] Rewrite the Receives, Spike and How of the `react-ui` skill: it receives the screens with their spikes and journeys; it builds each page from its spike against stub controllers holding the spike's data; it writes each journey's test (`agent.act` in natural language, locators and `expect` on what the page shows, never `agent.waitFor` or `agent.extract`) and runs it against the stubs; the first web change of a product writes `e2e.config.ts` from the local-run procedure and commits `.e2e/cache`
- [x] Reword rubric row S23 and the decision `page-store` so the exempt stub is the one `react-ui` writes before `react-hooks` replaces it, not "the spike's"
- [x] Rewrite the README's paragraph on web changes, raise the package and command version to 0.10.0 and name it in the README
- [x] Verify `pnpm run check` passes, the three packages build fresh, and `factory verify throwaway-spikes --proved flow/plan --proved flow/implement` records the evidence

## Feedback

- Built on 2026-11-17 by the agent, both phases in one run, at the person's request ("Si implementalos").
- Found while building (phase 2): the `react-hooks` skill ("the plan left end-to-end tests") and the `adapters` skill ("the literal data the plan's spike painted") also named the old spike; both now name `react-ui` and the approved spike.
- Found while building (phase 2): the `react-ui` skill's step 5 mounts the app with the product's `local-run` procedure and compares each screen with its spike; step 6 is the end-to-end tests the plan used to write.

## Next step

Build this change through the implement phase, phase by phase, then verify and archive it.
