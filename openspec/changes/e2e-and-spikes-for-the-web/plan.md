---
name: e2e-and-spikes-for-the-web
description: A web change is spiked in the browser while planning, its end-to-end tests are written against the spike with e2e-inc/e2e and kept passing through the implementation, and verify, not an integrate workstream, proves the product works as a whole
created_at: 2026-11-16
created_by: the person
schema: spec-plan
---

# Spike and test web changes end to end

## Goal

The person sees and corrects the screens of a web change while it is being planned, not at the end of the implementation. The plan builds the visual workstream of the change (for `clean-react`, `react-ui`) as a spike, in place, against stub controllers, gets each screen approved by whoever can decide it, and writes the end-to-end tests of its journeys with `e2e-inc/e2e`, passing against the spike. The implementation keeps those same tests passing with the real hooks, use cases and in-memory adapters behind the screens. The workstream `integrate` goes away: workstreams stay decoupled, and verify is what proves that together they work, running the whole-product checks and, for a web product, the end-to-end tests. None of it is specific to React: it hangs on the platform `web` and on the spike workstream a schema declares.

## Findings

- `e2e` (npm, bin `e2e`) is at 0.23.1 (2026-11-13); the newest version at least two weeks old is `e2e@0.22.0` (2026-10-30), with `@e2e-dev/web@0.15.4` and `@e2e-dev/acp@0.1.0` of the same day; engines `node ^22.22.3 || >=24.8.0` (npm registry, seen 2026-11-16).
- A test is TypeScript, `tests/**/*.e2e.ts` by default, with `agent.act`/`agent.assert` in natural language and locators with `expect` (`examples/with-vite/tests/agentic.e2e.ts` and `docs/agentic-vs-deterministic.mdx` of github.com/e2e-inc/e2e @3fac999, seen 2026-11-16).
- `agent.act` is recorded once a later check verifies it and replayed without a model from `.e2e/cache/`; `agent.assert`, `waitFor` and `extract` always run live; `--strict-cache` turns a stale recording into exit 2 (`docs/cache.mdx` @3fac999, seen 2026-11-16).
- `@e2e-dev/acp` runs `agent.act` and `agent.assert` on Claude Code or Codex over the Agent Client Protocol with the agent's own login; `waitFor` and `extract` need a model entry (`docs/acp.mdx` of `e2e@0.22.0`, seen 2026-11-16).
- The config `e2e.config.ts` has no `baseURL` or `webServer`: a target's `app.url` and `app.command` (with `readyUrl`, `env`, a free port `{port}`) start the app; routes can be stubbed with `browser.route` (`docs/reference/config.mdx`, `docs/web.mdx`, `docs/browser.mdx` @3fac999, seen 2026-11-16).
- Exit codes: 0 pass, 1 test failure, 2 CLI/config/credential error, 3 infrastructure, 4 internal, 130 interrupted; `<output>/report.json` holds `run.results[].status` and is not written when the run stops before its tests (`docs/reference/cli.mdx`, `schema/report-v1.schema.json` @3fac999, seen 2026-11-16).
- Telemetry is on by default and off with `E2E_TELEMETRY_DISABLED=1` (README @3fac999, seen 2026-11-16). License Apache-2.0; "in active development on the way to 1.0".
- `e2e mcp` lets a coding agent drive the app live and write a test from lines it checked; nothing in the CLI writes a test file by itself (`docs/mcp-server.mdx`, `docs/explore.mdx` @3fac999, seen 2026-11-16).
- `react-ui` already builds every page against a stub controller that returns literal data, and `react-hooks` later replaces its body keeping its shape (`schemas/clean-react/workstreams/react-ui/SKILL.md` @ddb9aa1).
- `integrate` owns no layer, only `no-unused-files` and `duplication-below-threshold`, and its skill announces "End-to-end tests will live here once `test/e2e` has them" (`schemas/shared/cores/clean-core/workstreams/integrate/workstream.ts`, `SKILL.md` @ddb9aa1). `test/e2e/**` is already in `allowUnmatched` and outside the product roots the guard closes (`schemas/spec-plan/schema.ts:87`, `toolkit/package/guard.ts` `productRoots` @ddb9aa1).
- `factory test` knows the kinds `acceptance` and `integration`, run with vitest (`toolkit/architecture/test.ts` @ddb9aa1).
- The plan of `clean-react` left end-to-end tests for later, "una vez que ya se sepa el runbook y cómo se monta en local", with the adapters or the core replaced by doubles (`openspec/changes/archive/2026-11-15-clean-react/plan.md:24` @ddb9aa1).

## Decisions

Agreed with the person in the Easel session of 2026-11-16:

- The spike is built in the product's framework: the schema's visual workstream, against stub controllers, reused by the implementation. The person: "la parte visual solamente y se le pone, por ejemplo, los controllers y los hooks moqueados […] el primer workstream se haría como un prototipo a nivel de spike". Discarded: one static HTML page per screen in the change folder (thrown away; the person wants the same code reused), and wireframes in text.
- The plan writes the spike where it will stay: the guard opens to a change being planned the paths of its schema's spike workstream, and the implementation starts with that workstream done. Discarded: writing it in the change folder and copying it to `src` in implement.
- The plan writes the end-to-end tests and leaves them passing against the spike; the implementation keeps them passing. Discarded: natural-language journeys the implementation translates, and tests written from scratch in implement.
- In implement and verify, the doubles sit at the adapter: the real UI, hooks and use cases over in-memory adapters seeded with the spike's data. The person: "mockearlo mejor a nivel de adapter y que tendrían que pasar los mismos tests". Discarded: doubles at the controller (the hooks would have no browser test, and stub and real controllers would have to coexist through a new dependency inversion), and stubs in implement with adapters only in verify.
- Steps: `agent.act` in natural language plus deterministic checks. Discarded: everything in natural language (`agent.assert` calls the model on every run), and deterministic steps only (what makes the tool clever is lost).
- The end-to-end tests run automatically only in verify, and by hand with `factory test e2e`. Discarded: in the completion gate of every turn (each turn would wait for a browser and maybe a model), and in a workstream check.
- The spike is required: validation holds a change whose screens lack `@approved`. A screen is a visual decision, and as with any decision, the person: "si se puede tomar la decisión, que la tome. Si es una decisión que necesita el usuario, ahí lo va a hacer el usuario". Discarded: an instruction with no rule, and a spike only on request.
- `integrate` goes away in this change: workstreams stay decoupled and verify is what proves they work together. The person: "los workstreams siempre se hacen desacoplados […] y el verificador es el que revisa si entre todos funcionan". Discarded: a separate later change, and keeping `integrate`.

Taken from the code and conventions, and shown to the person in the approved synthesis:

- This repository's own change, opened with `spec-plan` (`README.md`, Work on this repository).
- It is not React's: a schema declares its spike workstream (`clean-react`: `react-ui`), and end-to-end tests belong to every product of platform `web`. A future Vue or Svelte schema declares its own.
- Pinned tools: `e2e@0.22.0`, `@e2e-dev/web@0.15.4`, `@e2e-dev/acp@0.1.0`, the newest at least two weeks old; setup reports them as `missing` for a web product, and a Node older than 22.22.3.
- Agent steps run on Claude Code or Codex over ACP (`claudeCode()` or `codex()` as executor), so no new API key. `agent.waitFor` and `agent.extract` are not used: under ACP they need a model of their own.
- `factory test e2e` wraps `e2e run` with `E2E_TELEMETRY_DISABLED=1`, reads its exit code first (2, 3 and 4 mean the run could not start) and then `.e2e/report.json` for each test.
- Mounting a web product locally is a `setup` procedure of topic `local-run` that the plan reuses or writes, and runs while planning to mount the spike; the `app.command` of `e2e.config.ts` comes from it.
- `.e2e/cache/` is committed, so a recorded `agent.act` replays without a model; verify runs with `--strict-cache` when the cache exists.
- The end-to-end tests the plan writes go straight to `test/e2e/<module>/`; the spike in place is already the app they open.
- The data the spike paints is the data the in-memory adapters of the end-to-end environment are seeded with.
- No new dependency inversion in the UI: a page keeps importing its controller, and `react-hooks` replaces the stub in the same file, as today.
- With no `integrate`, `no-unused-files` and `duplication-below-threshold` belong to no workstream: `factory check` and verify run them, the completion gate does not (halfway through an implementation some code is not wired yet). A whole-product finding is raised on the workstream whose Owns line holds the file, or on the change.
- Before this change can be ready, `probe-resources-while-planning` is archived, since a ready change puts its scenarios into this repository's generated tests. The person agreed on 2026-11-16 ("Sip"); it was committed as `0159aef` and archived as `03f00c2`.
- Version 0.7.0: the plan phase, validation, verify, setup, the guard, the topology and a new command change.

Assumptions of mine, not agreed one by one:

- A schema declares its spike workstream as `spike: "<workstream>"` in its definition; the guard opens the paths of that workstream's layers plus the stub controllers it fakes (`framework/controllers/*.controller.ts`) and the configured entry.
- "Being planned" is an active change of the product that is not in implementation; a ready change not yet started stays open to its spike paths, so feedback on a screen can still be applied.
- The plan names its screens in a new `## Screens` section of the plan template, after `## Procedures`: one `### Screen: <slug> · <title>` block with `@approved:<YYYY-MM-DD or declined>` and `@page:<path>`. The template keeps the section for every schema; it stays empty where there is no spike workstream.
- The spike workstream's tasks are written in the plan's first phase already checked, so implement starts at the next workstream.
- The environment the end-to-end tests run in is named `e2e`; the adapter of each module picks the in-memory one for it, as it does for tests.
- `e2e.config.ts` is written by the plan of the first web change of a product, next to the `local-run` procedure, and lives at the product's root; `test/e2e` is configurable as `e2e` in `factory.config.ts`.
- A failing end-to-end test is raised on the change, not on a workstream: it names no file.
- `react-hooks` keeps depending on `react-ui` only, and may run alongside `modules`.

## Open questions

## Architecture decisions

### Decision: spike-while-planning · A web change is spiked and its end-to-end tests are written while planning

@adds @area:product @topic:flow @applies:phases,schemas,toolkit @enforced:screen-approved,write-guard

A schema whose platform is `web` SHALL declare a spike workstream. The plan of a change that touches what a user sees SHALL build that workstream's part as a spike, in place, against stub controllers, SHALL get each screen approved by whoever can decide it (`@approved`), and SHALL write the end-to-end tests of its journeys, passing against the spike. The implementation SHALL keep them passing with the real code behind the screens, the doubles sitting at the adapters.

**Why** The person saw the screens only at the end of the implementation, when changing them is expensive. A spike in the product's own framework is reused rather than thrown away, and tests that pass against it before any logic exists fix what the screens must do.

**Alternatives** A static HTML spike in the change folder, discarded because it is thrown away. Writing the tests in implement, discarded because they would not be checked against what the person approved. Doubles at the controller, discarded because the hooks would have no browser test.

**Consequences** Planning a web change needs the product mountable locally. The guard opens part of the product to a change being planned. The plan of a web change takes longer; the implementation needs nothing more from the person on the screens.

### Decision: verify-joins-the-product · Workstreams stay decoupled and verify proves they work together

@adds @area:product @topic:implementer @applies:schemas,toolkit @enforced:verify,implementer-spec

No workstream SHALL own the checks that need the whole product joined. A core SHALL list only workstreams that own layers. Verify SHALL run the whole-product checks and, for a web product, its end-to-end tests, and SHALL raise each failure on the workstream that owns the file, which the next implement run fixes.

**Why** The person wants every workstream decoupled and one place that proves the parts fit; a reduce workstream that only checks duplicated what verify already does.

**Alternatives** Keeping `integrate` as the last workstream that fixes global findings, discarded by the person. Running the global checks in the completion gate, discarded because a half-built change has unwired code.

**Consequences** Dead code or duplication is found at verify, not during implement, and costs one more implement run. `clean-backend` loses `integrate` too.

## Procedures

## Phases

### Phase 1: verify joins the product, and integrate goes away

**Tests**

The generated tests of the requirements modified in `implementer`, `repository/build`, `flow/plan-validation` and `flow/verify` (no `integrate` in any table), and those added: `Whole-product checks belong to no workstream` and `Verify proves the product works as a whole` (whole-product findings only; end-to-end rows come in phase 3). `implementer` has no step adapter: proved by the repository's tests and the person's word.

- [x] Remove the workstream `integrate` from `schemas/shared/cores/clean-core` (folder, `core.ts` list and topology) and from the topology of `schemas/clean-react/schema.ts`
- [x] Move `no-unused-files` and `duplication-below-threshold` to whole-product checks of the core that `factory check` runs after every workstream and `factory check --workstream` never runs; keep them out of the completion gate
- [x] Make `toolkit/flow/verify.ts` run the whole-product checks and raise each finding on the workstream whose layers hold the named file, or on the change
- [x] Update every test, step adapter and fixture that names `integrate`, add the step adapter methods of the added scenarios, and generate the tests
- [x] Update the skills that name `integrate` (implement, the modules skill) and the README
- [x] Verify `pnpm run check` passes

### Phase 2: the plan spikes the screens and validation holds them

**Tests**

The generated tests of `Every screen a web change lists is approved` (`flow/plan-validation`) and `A change being planned opens the paths of its spike workstream` (`package/write-guard`). `flow/plan` has no step adapter: proved by the person's word.

- [x] Add `spike` to the schema definition type and declare `spike: "react-ui"` in `clean-react`; the build fails naming it when it is not one of the schema's workstreams
- [x] Add `## Screens` to `schemas/spec-plan/templates/plan.md` and the screen block to `planInstruction`
- [x] Add the rule `screen-approved` to the standard validator, with its step adapter methods, and generate the tests
- [x] Make `toolkit/package/guard.ts` open the spike workstream's paths to an active change not in implementation, with its step adapter method, and generate the tests
- [x] Add the spike step to `schemas/shared/phases/plan/SKILL.md`: reuse or write and run the `local-run` procedure, build the spike workstream against stub controllers, list the screens, approve the agent's, ask the person's with the spike mounted, apply their changes
- [x] Tell the `implement` skill and the `react-ui` skill that the spike workstream may arrive built and checked
- [x] Verify `pnpm run check` passes

### Phase 3: end-to-end tests with e2e-inc/e2e

**Tests**

The generated tests of `The end-to-end tests of a web product run through the command` (`implementer`, proved by the repository's tests), the end-to-end rows of `Verify proves the product works as a whole` (`flow/verify`) and `Setup reports the end-to-end tools a web product lacks` (`package/setup`).

- [x] Add the kind `e2e` to `factory test`: run `e2e run` over the configured `e2e` root with telemetry off and `--strict-cache` when `.e2e/cache` exists, map the exit code, read `.e2e/report.json`, write `--report`
- [x] Make verify run `factory test e2e` for a web product and record each test in the evidence
- [x] Make `toolkit/package/doctor.ts` report the pinned end-to-end packages and Node for a web product, and add the step adapter methods
- [x] Add to the plan skill: write the end-to-end tests of each journey under `test/e2e/<module>/` with `agent.act` and deterministic checks, write `e2e.config.ts` from the `local-run` procedure with Claude Code or Codex as executor, run them against the spike until they pass, commit `.e2e/cache`
- [x] Add to the `react-hooks` and `adapters` skills: the in-memory adapters of the `e2e` environment are seeded with the spike's data, and the end-to-end tests stay passing
- [x] Add the pinned packages to the `frontend` and `fullstack` manifests and the README
- [x] Verify `pnpm run check` passes

### Phase 4: the package carries it

**Tests**

`factory build backend --check`, `factory build frontend --check` and `factory build fullstack --check` are fresh after a build.

- [x] Raise the package and command version to 0.7.0
- [x] Verify `pnpm run check` passes, the three packages build fresh, `factory proof` passes for `backend` and `frontend`, and `factory verify e2e-and-spikes-for-the-web --proved flow/plan --proved implementer` records the evidence

## Feedback

- Easel session on 2026-11-16 with the person: the eight decisions listed as agreed came from there, with the person's notes quoted; the person approved a synthesis that listed the rest as taken from the code. The assumptions above were not part of it.
- Built on 2026-11-16 by the agent, all four phases in one run, at the person's request ("implementa ya todas las fases de corrido").
- Found while building (phase 1): the whole-product checks live in `schemas/shared/cores/clean-core/checks.ts`, named by the core as `checks`; `factory check --whole` runs only them, and verify calls it once every workstream passes, then attributes each file the output names to the workstream whose layer zones hold it. A change of a schema with no workstreams runs neither the whole-product checks nor the end-to-end tests.
- Found while building (phase 1): the verify delta's example named `src/orders/domain/order.entity.ts`, which no zone holds; it now names `src/orders/domain/entities/order.entity.ts`. A second scenario of the same delta used the literal `web` where its step takes a placeholder; it now has a `platform` column.
- Found while building (phase 2): the schema declares its spike as `spike: { workstream, fakes }` rather than a bare name, so that the stub controllers it writes (`framework/controllers/*.controller.ts`) are named by `clean-react`, not by the toolkit; loading a schema fails when `spike` names none of its workstreams. `factory schemas` prints it.
- Found while building (phase 3): `e2e` is a new root of the configuration (`test/e2e` by default), and `no-unused-files` takes the end-to-end tests and `e2e.config.ts` as entries. `factory test e2e` maps the tool's status 2, 3, 4 and 130 to 2 with the cause, and reads `.e2e/report.json`; a test is reported as `<file stem> · <title>`.
- Found while building (phase 3): `doctor` became asynchronous, since knowing whether a product is a web one reads `factory.config.ts`; it asks only when the installed package pins end-to-end tools (`project.e2e` of the `frontend` and `fullstack` manifests). `factory proof` adds those packages with the test runner and the type checker.
- Not done: `@agentclientprotocol/claude-agent-acp` (or `codex-acp`), which the `claudeCode()` executor of `@e2e-dev/acp` needs, is not pinned by the package; the plan skill names the executor and the project adds it. A later change can pin it once a release is two weeks old.

## Next step

Build this change through the implement phase, phase by phase. The change after it, in the order the person gave: a reference module that also writes (mutation, store and bridge).
