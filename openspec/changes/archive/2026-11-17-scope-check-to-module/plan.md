---
name: scope-check-to-module
description: Limit a scoped check to findings from the selected module
created_at: 2026-11-17
created_by: the person
approved_at: 2026-11-17
schema: spec-plan
---

# Check just the selected module

## Goal

A module check reports findings on that module's own files. Whole-product checks and generation freshness run over the whole product.

## Findings

- The frozen module check reports package and architecture findings whose payloads only refer to shared files (migration phase 1, 2026-11-17).
- The check matches the entire serialized violation, and still runs whole-product checks and generation freshness when given a module (check command, 2026-11-17).

## Decisions

- Scope findings by the file they report and keep cycles that involve the requested module. Discard string matching across the whole finding. @by:person
- Reserve whole-product checks and generation freshness for unscoped runs. Discard hiding any of those checks in the global run. @by:person

## Open questions

## Architecture decisions

## Procedures

## Screens

## Phases

### Phase 1: Keep findings in scope

- [x] Scope architecture findings by their owning paths and leave whole-product checks global.
- [x] Prove scoped and global runs in the same minimal project.
- [x] Verify typecheck, generated test freshness and the repository test suite.

## Feedback

## Next step
