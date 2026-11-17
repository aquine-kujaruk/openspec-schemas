---
name: verify-generated-gauges
description: Match verification to the generated product tests and skip removal-only deltas
created_at: 2026-11-17
created_by: the person
approved_at: 2026-11-17
schema: spec-plan
---

# Verify the generated gauges

## Goal

Verify finds every generated acceptance test at the path generation writes, including when the product specs live below a custom prefix. A delta that only removes requirements contributes no acceptance tests to the verdict.

## Findings

- The frozen command generates `test/acceptance/quality/audit.feature.test.ts` but looks for it at `test/acceptance/factory/quality/audit.feature.test.ts` in verification (migration preflight, 2026-11-17).
- Verify currently schedules tests for all delta files, including those with only REMOVED Requirements (migration preflight, 2026-11-17).

## Decisions

- Share the product test path calculation used by generate and verify. Discard changing the generated path because projects already rely on it. @by:agent
- Exclude removal-only deltas from acceptance matching. Keep checks and mixed deltas in the verdict. Discard requiring manual evidence for removed scenarios. @by:person

## Open questions

## Architecture decisions

## Procedures

## Screens

## Phases

### Phase 1: Match the generated tests

- [x] Use one product test path calculation in generation and verification.
- [x] Exclude removal-only deltas and prove that mixed deltas still require passing tests.
- [x] Verify with typecheck, generation freshness and repository tests.

## Feedback

## Next step
