---
name: architecture-decisions-reach-the-person
description: Validation reports a change not ready while an architecture decision of its plan was taken by the agent alone.
created_at: 2026-11-27
created_by: Edgar
approved_at: 2026-11-27
schema: spec-plan
---

# Architecture decisions reach the person

## Goal

An architecture decision binds future changes, and `ask-on-commitment` already sends every one to the person. Validation holds it too: a change is not ready while one of its architecture decisions is tagged `@by:agent`, and the finding tells the agent to ask it under Open questions and tag it `@by:person` once answered.

## Findings

- On 2026-11-27, `schemas/spec-plan/questions/ask-on-commitment.md` lists "every architecture decision the plan writes" among the decisions the person takes, and `decision-authored` in `schemas/spec-plan/validators/standard/validator.ts` accepts `@by:agent` on an architecture decision.
- On 2026-11-27, in a project built with `clean-backend`, a plan added the architecture decision `system-files` (where the product stores its data) tagged `@by:agent`; validation reported it ready, it was archived, and the person replaced it the same day with a decision of their own. The guard would have stopped it at planning.
- On 2026-11-27, `openspec/changes/archive/2026-11-17-carry-approved-plans-through-verification/plan.md` holds one architecture decision tagged `@by:agent` (a `@modifies`); archived changes are not validated again, so the guard leaves it as it is.
- On 2026-11-27, the step adapter `decisionOfKindTaggedBy` in `plan-validation.feature.steps.ts` builds an architecture decision with the tags of the row and every other scenario's decision carries `@by:person`, so only the new row meets the guard.

## Decisions

- The guard applies to every operation on an architecture decision (`@adds`, `@modifies`, `@replaces`, `@renames`, `@removes`), as `ask-on-commitment` asks for every architecture decision the plan writes. Discarded: only `@adds` and `@replaces`, which would let an agent modify a standing decision alone. @by:agent
- The guard reports under the rule `decision-authored`, naming the decision, so one rule says who may take what. Discarded: a rule of its own, which would split one requirement in two checks. @by:agent
- The plan instruction of the schemas says it too, next to who tags what, so the agent asks before validation sends it back. Discarded: leaving it only in `ask-on-commitment`. @by:agent
- The change adds no architecture decision: the requirement of `flow/plan-validation` holds the rule. @by:agent
- The person asked for this guard and to plan, implement and archive it without a further question unless a decision was theirs; no decision here is (2026-11-27). @by:person

## Open questions

## Architecture decisions

## Procedures

## Screens

## Phases

### Phase 1: An architecture decision taken by the agent stops the change

**Tests**

- The generated test of `plan-validation` runs every row of the modified scenario outline, the new row `architecture decision | @by:agent | not ready` among them.
- The whole offline suite and `pnpm exec factory check` pass.

- [x] `decision-authored` reports an architecture decision tagged `@by:agent`, with a message that tells the agent to ask it under Open questions and tag it `@by:person` once answered.
- [x] The plan instruction in `schemas/spec-plan/schema.ts` says an architecture decision is always the person's.
- [x] Regenerate the tests of `plan-validation` from the delta spec and run them, the whole suite and the factory checks.

## Feedback

- The whole offline suite passed 906 of 907 tests. The one failure, `stage-start-repository.test.ts` › keeps a spec-plan stage open until the builder verifies it (`not verified: record-outage`, evidence), fails the same on `main` without this change; it is left for a change of its own.

- The verify phase found the local schema copies under `openspec/schemas` stale after the plan instruction changed; `pnpm exec factory generate` refreshed them, and they are not tracked.
- **the verify phase**: regenerated the local schema copies with factory generate

## Next step

Verify and archive the change.
