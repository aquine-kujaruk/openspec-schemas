---
name: use-cases-branch-only-on-io
description: A branch that decides a business policy moves into the domain, and a use case keeps only the branches that decide whether to perform I/O; a new rubric row judges it and the write guard proves it by never reading work orders for a path its policy already resolved.
created_at: 2026-11-28
created_by: Edgar
approved_at: 2026-11-28
schema: spec-plan
---

# Use cases branch only on I/O

## Goal

A use case reads as orchestration: it reads, asks the domain, and decides only whether to perform the next read or write. Every policy branch of the factory's use cases (which area protects a path, which line owns it, which stage runs next, which result fails) lives in an entity, aggregate or value object. Rubric row S25 warns about a policy branch left in a use case, the write guard's acceptance test proves the work-order repository is never called for a path its policy already resolved, and the decision `branch-by-responsibility` stops being `@enforced:pending`.

## Findings

- `AuthorizeWriteUseCase.execute` decides in the use case whether a path is harness, which line owns it (longest folder wins) and whether it falls under the implicit roots, then reads the started work orders (`factory/change-control/application/use-cases/authorize-write.use-case.ts:77-107`, seen 2026-11-28).
- Use cases with the most `if`/`else`/`switch` lines: `inspect-work-order` 35, `hold-stage` 16, `audit` 12, `pull-andon` 11, `assess-work-order` 10, `make-reading-copies` 9, `close-work-order` 9, `authorize-write` 7 (grep over `factory/*/application/use-cases`, seen 2026-11-28). `inspect-work-order` also parses Markdown fences inside the use case.
- Row S18 asks whether a use case is an application service and S12 whether a service does what a domain object should; no row asks about a policy branch in a use case (`RUBRIC.md`, seen 2026-11-28).
- A deterministic rule cannot tell a policy branch from an I/O branch: both are an `if` over values (inference from the shapes above).

## Decisions

- The decision is held by a rubric row (S25) and an acceptance test of the write guard, not by a deterministic rule, because the facts do not separate policy from I/O; this follows the 2026-11-18 decision that a rubric row judges only interpretation. @by:agent
- S25 asks over `application/use-cases`: does this use case decide a business rule in a branch (which case applies, which value wins) instead of asking a domain object, beyond deciding whether to read or write? @by:agent
- The write policy becomes `WriteBoundaryAggregate.resolve(path)`, returning `harness`, `outside`, or the owning line; the use case reads the work orders only for an owning line. @by:agent
- All eight use cases listed in Findings are refactored in this change, in two phases. Discarded: only `authorize-write`, which would leave the factory teaching the opposite. @by:person
- Runs after `use-cases-hydrate-through-the-domain`, which gives the use cases the aggregates their policies move into. @by:agent

## Open questions

## Architecture decisions

### Decision: branch-by-responsibility · A branch lives with the responsibility it decides

@modifies:branch-by-responsibility @base:2026-11-18-reparar-revision-semantica @area:product @topic:clean-core @applies:schemas,factory @enforced:S25,authorize-write-acceptance @by:person

A branch that decides a domain policy SHALL live in the domain; a branch in a use case SHALL only coordinate whether to perform I/O.

**Why** A use case reads as orchestration; a policy branch inside it is a hidden state machine.

**Alternatives** Moving every branch out of application: the I/O decision belongs there. A deterministic rule: it cannot tell the two branches apart.

**Consequences** For a path the write policy already resolved, the work-order repository is never called; S25 warns in every product's review.

## Procedures

## Screens

## Phases

### Phase 1: The write guard asks its policy

**Seams**

```ts
// factory/change-control/domain/aggregates/write-boundary.aggregate.ts
resolve(path: string): { kind: "harness"; area: ProtectedAreaValueObject } | { kind: "outside" } | { kind: "line"; line: WritableLine };
```

**Tests**

- The acceptance tests generated from the delta spec of `authorize-write`, with a spy on the work-order repository.

- [x] Move the harness areas, the line lookup and the implicit roots into `WriteBoundaryAggregate`
- [x] Make `AuthorizeWriteUseCase` read the started work orders only for a path that resolves to a line
- [x] Verify the phase: `pnpm run check`

### Phase 2: The other use cases orchestrate

**Seams**

```md
S25 · policy-branch-in-use-case, over application/use-cases, with one yes case and one no case in application.examples.md
```

**Tests**

- The factory's tests keep passing; S25's cases are judged and recorded.

- [x] Move the policy branches of `inspect-work-order`, `hold-stage`, `audit`, `pull-andon`, `assess-work-order`, `make-reading-copies` and `close-work-order` into their domain objects
- [x] Add S25 to `RUBRIC.md` with its cases and scores, and teach it in the `app-domain` skill
- [x] Verify the phase: `pnpm run check`

## Feedback

## Next step
