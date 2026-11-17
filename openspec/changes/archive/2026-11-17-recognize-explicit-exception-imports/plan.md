---
name: recognize-explicit-exception-imports
description: Apply the approved explicit-extension handling to infrastructure exceptions
created_at: 2026-11-17
created_by: the person
approved_at: 2026-11-17
schema: spec-plan
---

# Recognize explicit exception imports

## Goal

Infrastructure recognizes the same domain exception imports with or without an explicit source extension. The module's exception family, the shared exception allowance and the required cause still apply.

## Findings

- The approved explicit-extension change did not reach the SDK predicate used by the infrastructure and adapter exception rules. Valid imports ending in `.exceptions.ts` cause phase 1 to fail (scoped worktree checks, 2026-11-17).

## Decisions

- Apply the same extension handling to both exception paths. Discard changing which exception classes the rule permits. @by:person

## Open questions

## Architecture decisions

## Procedures

## Screens

## Phases

### Phase 1: Resolve exception imports under NodeNext

- [x] Recognize the allowed source extensions in both exception paths.
- [x] Verify typecheck, fresh generation and the infrastructure reference and negative cases.

## Feedback

## Next step
