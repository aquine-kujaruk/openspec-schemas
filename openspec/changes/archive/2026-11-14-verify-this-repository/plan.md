---
name: verify-this-repository
description: A change of this repository that has delta specs is verified and archived by the command
created_at: 2026-11-14
created_by: the person
schema: spec-plan
---

# Verify this repository

## Goal

A change of this repository that has delta specs goes through the same commands as any other: its tests are generated from its deltas while it is open, `factory verify` matches its scenarios to those tests, and `factory archive` merges its deltas and consolidates its decisions. Today such a change is verified with `pnpm run check` and archived by hand: three changes went that way on 2026-11-14, and one decision was copied into `openspec/adr` by hand.

## Decisions

- This repository generates its tests from the specs as ready changes leave them, the way a project already does. Discarded: keeping the habit of copying each delta into the consolidated specs while building, which makes the archive merge it a second time and fail.
- Where a spec's test is written is asked of one place, the one generation uses, so verification and generation cannot disagree. Discarded: a second map inside verification.
- In this repository verification runs the repository's own test runner on the tests of the change's specs. Discarded: running every test, which is what `pnpm run check` is for.
- A delta spec of this repository that no test is generated from is proved by the person's word, given when verifying and recorded in the evidence as such. The person chose it on 2026-11-14. Discarded: never verifying such a change until its capability has a step adapter, and letting verification ignore those specs.
- The person's word is given as an option of `factory verify`, one per spec, as a procedure's outcome is given today. Discarded: a file listing the specs that need no test, which would prove them for every later change without anyone looking.
- The four capabilities that have no step adapter today (`implementer`, `architecture/linting`, `flow/plan`, `flow/implement`) are left as they are. Giving each a step adapter is a change per capability.

## Open questions

## Architecture decisions

## Procedures

## Phases

### Phase 1: The repository's tests come from its open changes

**Tests**

A test of generation in a scratch copy of this repository: a ready change adding a scenario to a spec gets it generated, a change that is not ready does not. The scenarios of `implementer` have no step adapter and stay proved by that test.

- [x] Make generation in this repository read each spec as the ready changes leave it, the way it does in a project
- [x] Add the test of generation in a scratch copy, for a ready change and for one that is not
- [x] Verify `pnpm run check` passes and that this change's own delta of `flow/verify` now has its scenarios generated, failing for lack of code, without the delta being copied into the consolidated specs

### Phase 2: Verification finds the tests and takes the person's word

**Tests**

The scenarios generated from the two new requirements of `flow/verify`, with its step adapter.

- [x] Give generation and verification one answer to where the test of a spec is written: the acceptance root in a project, the folder of the spec's step adapter in this repository, nowhere when it has none
- [x] Make verification in this repository run the repository's test runner on the tests of the change's specs and read each scenario's result
- [x] Add the person's word to `factory verify`, for a spec no test is generated from, in this repository only; record it in the evidence
- [x] Say in the README how a change of this repository is verified and archived
- [x] Raise the package version
- [x] Verify `pnpm run check` passes, `factory build backend --check` is fresh after a build and `factory proof` exits zero
- [x] Verify this change with `factory verify`, giving the person's word for `implementer`, and see the evidence match the scenarios of `flow/verify` to their tests

## Feedback

## Next step

Build it through the implement phase, and archive it with `factory archive`: it would be the first change of this repository with delta specs to be archived by the command.
