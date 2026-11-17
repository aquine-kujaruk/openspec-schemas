---
name: unit-test-zone
description: The clean core gains a fourth kind of test, unit, in test/unit/<module>/, mirroring the domain or application file it tests, with a rule that holds where it lives and what it imports
created_at: 2026-11-17
created_by: the person
approved_at: 2026-11-17
schema: spec-plan
---

# A zone for unit tests in the clean core

## Goal

A product built with the clean core has a place for unit tests that a rule fixes, as it fixes acceptance and integration tests: `test/unit/<module>/`, one test per domain or application file it targets, never touching infrastructure. `factory prepare` creates the root, `factory test unit` runs it, and the implementer's app-domain workstream owns it.

## Findings

- The clean core knows three kinds of test: acceptance (`test/acceptance/<module>/`, generated from the product specs), integration (`test/integration/<module>/<x>-repository.test.ts`) and end-to-end (`test/e2e/`); `Options` names their roots and `WorkstreamDeclaration.tests` takes only `"acceptance" | "integration"` (`factory/shared/domain/types.ts:92-117`, seen 2026-11-17).
- The rule `no-tests-in-src` refuses every `*.test.ts` under the module root (`schemas/shared/cores/clean-core/workstreams/modules/modules.rules.ts:71`, seen 2026-11-17), so a unit test has no valid place today: under `test/unit/` it falls outside every zone and breaks `every-file-in-a-zone`.
- `factory/` holds about 25 hand-written unit tests next to its code (`find factory -name '*.test.ts' ! -name '*.feature.test.ts'`, seen 2026-11-17); the change `factory-as-clean-backend`, planned next, moves them to this zone.
- `factory test <kind>` runs a kind's root with the project's vitest from a table of kinds, `acceptance` and `integration` (`factory/architecture/application/test.ts:20-23`, seen 2026-11-17).
- In this worktree `pnpm exec factory` is the command pinned from the installed package, not this repository's code, so the repository's own checks run as `node factory/main.ts` (`package.json` devDependencies, seen 2026-11-17).

## Decisions

- Unit tests get a zone of their own in the clean core rather than turning every unit test into a scenario of a product spec, which would lose the tests of internal pieces. @by:person
- The zone lives in the clean core, so `clean-backend` and `clean-react` both have it; discarded: only in `clean-backend`. @by:agent
- The layer `unit` belongs to the `app-domain` workstream, which owns the domain and application it tests; discarded: a workstream of its own, which would own no product layer. @by:agent
- A unit test mirrors the path of the file it tests (`test/unit/<module>/domain/entities/change.entity.test.ts` ↔ `<modules>/<module>/domain/entities/change.entity.ts`); discarded: a free name inside the module folder, which no rule can tie to a target. @by:agent
- In this worktree the phase is verified with `pnpm run typecheck && node factory/main.ts generate --check && pnpm run test`, the repository's own command; `pnpm run check` would call the pinned one. @by:agent

## Open questions


## Architecture decisions

### Decision: unit-tests-mirror-the-core · Unit tests live in test/unit and mirror the core file they test

@adds @area:product @topic:tests @applies:schemas,factory @enforced:unit-test-targets-core-file,unit-imports-only-the-core @by:person

In a schema built on the clean core, a unit test SHALL live at `<unit>/<module>/<path>.test.ts`, where `<modules>/<module>/<path>.ts` exists and `<path>` starts with `domain/` or `application/`. It SHALL import only the domain and application of the product and its test runner, never infrastructure, adapters or the entry. No test SHALL live under the module root.

**Why** The person wants every test placed by a rule, never where it falls: acceptance and integration already are, and unit tests are the kind a module may need beside acceptance.

**Alternatives** No unit tests, every behaviour as a scenario of a product spec: loses the tests of internal pieces. Unit tests next to the code: couples tests to the source tree and breaks `no-tests-in-src`.

**Consequences** A unit test of a file that moves must move with it. Infrastructure is proved only by integration tests, and the whole by acceptance.

## Procedures

## Screens

## Phases

### Phase 1: The clean core has a unit zone

**Seams**

```ts
// factory/shared/domain/types.ts
export type Options = {
  // …
  /** Where the unit tests live (`test/unit`): one folder per module, mirroring the domain and application files they test. */
  unit: string;
};
export type WorkstreamDeclaration = {
  // …
  tests?: Array<"acceptance" | "integration" | "unit">;
};

// schemas/spec-plan/schema.ts: defaults
unit: "test/unit",

// schemas/shared/cores/clean-core/workstreams/app-domain/unit.rules.ts
export const unit: (o: Options) => Layer; // zone "unit" over `${o.unit}/**`, may import domain and application

// schemas/shared/cores/clean-core/workstreams/app-domain/workstream.ts
layers: (o) => [acceptance(o), domain(o), application(o), unit(o)],
tests: ["acceptance", "unit"],
```

**Tests**

- The tests generated from `architecture/unit`: each case of `unit.examples.md` breaks its rule in the files its `expect` block records, and the reference breaks none.
- The tests generated from the modified `implementer` spec: `factory prepare` creates `test/unit`.
- This repository's tests over the workstreams (`case-ids`, `rule-ids`, `scaffolds`, `factory`): the new layer is complete and its rule ids are unique.

- [ ] Add `unit` to `Options`, `"unit"` to `WorkstreamDeclaration.tests` and `unit: "test/unit"` to the defaults of `spec-plan`; let `factory prepare` create it and `factory test unit` run it with the project's vitest, as `acceptance` and `integration`
- [ ] Write `unit.rules.ts` in the clean core's `app-domain` workstream: the zone `unit`, its boundary (domain and application only), the archunit rule `unit-test-targets-core-file`; add the layer and the test kind to `workstream.ts`
- [ ] Write `unit.examples.md` (a reference test of a value object, and one case per way of breaking each rule) and record each case's `expect` block with `node factory/main.ts expect`
- [ ] Generate the tests of `architecture/unit` and of the modified `implementer` spec with `node factory/main.ts generate`, and write the step adapter `unit.feature.steps.ts` as `integration.feature.steps.ts` is written
- [ ] Name `test/unit/<module>/` in the Owns line and the steps of the `app-domain` skill, and in the docs that list the kinds of test
- [ ] Verify the phase: `pnpm run typecheck && node factory/main.ts generate --check && pnpm run test`

## Feedback

## Next step
