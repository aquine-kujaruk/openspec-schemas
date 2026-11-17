---
name: whole-product-checks-honor-ignore
description: The whole-product checks leave out what the configuration ignores and count unit tests as reached, so a line that shares its repository with other code is checked alone
created_at: 2026-11-17
created_by: the person
approved_at: 2026-11-17
schema: spec-plan
---

# Whole-product checks see the same product the zones see

## Goal

`factory check` judges the same files in every check. What `ignore` leaves out of the zones is left out of `no-unused-files` and `duplication-below-threshold` too, and the unit tests the clean core now has are reached, like acceptance and integration tests. This lets the factory, which shares this repository with `schemas/`, `packages/` and `tools/`, be checked as a clean-backend line.

## Findings

- With `ignore: ["schemas/**", "packages/**", "tools/**", "openspec/**", "docs/**"]` in `factory.config.ts`, `every-file-in-a-zone` stops reporting those folders, but `no-unused-files` and `duplication-below-threshold` still report 26 files of `schemas/`, `packages/`, `tools/` and `openspec/` (`pnpm exec factory check` in the worktree, seen 2026-11-17).
- `leaveOthers` adds only the folders of the other products to a whole-product check's `ignorePatterns`, never the configuration's `ignore` (`factory/architecture/application/check.ts:44-50`, seen 2026-11-17).
- `no-unused-files` counts as entries the entry files, `<acceptance>/**/*.test.ts`, `<integration>/**/*.test.ts` and the end-to-end tests, but not `<unit>/**/*.test.ts`, which `unit-test-zone` added (`schemas/shared/cores/clean-core/checks.ts:31-46`, seen 2026-11-17).
- `FactoryConfig.ignore` is documented as "Paths fallow ignores entirely" (`factory/shared/domain/types.ts:142`, seen 2026-11-17).
- In this worktree `pnpm exec factory` is the command pinned from the installed package; the repository's own checks run as `node factory/main.ts` (seen 2026-11-17).

## Decisions

- A whole-product check adds the configuration's `ignore` to its `ignorePatterns`, next to the other products' folders; discarded: a separate ignore list per check, which the person would have to keep in step. @by:agent
- The unit root joins the entries of `no-unused-files` in the clean core's checks; discarded: leaving unit tests out and ignoring `test/unit`, which would hide unit tests nothing runs. @by:agent
- The modified behaviour is proved by unit tests of `check` and by the person's word on `implementer`, which has no generated test; discarded: a step adapter for the whole implementer spec. @by:agent
- The phase is verified with `pnpm run typecheck && node factory/main.ts generate --check && pnpm run test`; `pnpm run check` would call the pinned command. @by:agent

## Open questions


## Architecture decisions

## Procedures

## Screens

## Phases

### Phase 1: Whole-product checks honor ignore and reach unit tests

**Seams**

```ts
// factory/architecture/application/check.ts
// a whole-product check's ignorePatterns = its own + the other products' folders + config.ignore
const leaveOthers: (body: unknown) => unknown;

// schemas/shared/cores/clean-core/checks.ts: no-unused-files entries gain
`${o.unit}/**/*.test.ts`,
```

**Tests**

- A unit test of `check` (next to it, as this repository's tests stand today): with `ignore: ["tools/**"]` a whole-product check's configuration lists `tools/**`; without it, it does not.
- A test of the clean core's checks: the configuration of `no-unused-files` lists the unit root among its entries.

- [x] Add the configuration's `ignore` to every whole-product check's `ignorePatterns` in `check.ts`, and test it
- [x] Add `${o.unit}/**/*.test.ts` to the entries of `no-unused-files` in the clean core's `checks.ts`, and test it
- [x] Verify the phase: `pnpm run typecheck && node factory/main.ts generate --check && pnpm run test`

## Feedback

## Next step
