---
name: adapters-wrap-external-systems
description: An adapter wraps an external system and nothing else; internal ports such as change control reaching production are composed in the composition root, and a repository states the operation that a generic resource adapter executes. A clean-core rule refuses an adapter that only forwards a callback.
created_at: 2026-11-28
created_by: Edgar
approved_at: 2026-11-28
schema: spec-plan
---

# Adapters wrap external systems

## Goal

Every adapter of the factory and of every clean-core product wraps something outside the code: a package, an API, the disk, the environment, or an in-memory stand-in for one. A module that needs another module's operation receives it through its repository interface, connected in the composition root and validated with the consumer's contract, with its errors kept. The repository states the operation or query, and a generic resource adapter (disk, HTTP, process) executes it. The rule `adapter-wraps-external-system` fails `factory check` on an adapter that only forwards a callback, and the decision `internal-ports-composed-directly` stops being `@enforced:pending`.

## Findings

- `ReleasedWorkOrderAdapter` takes `active: () => Promise<ReleasedWorkOrderRecord[]>` and its only method returns `this.active()`: it wraps a callback from production, not an external system (`factory/change-control/infrastructure/adapters/released-work-order.adapter.ts`, seen 2026-11-28).
- Adapters whose constructor takes callbacks from the composition files: `plant`, `process`, `released-work-order`, `write-boundary`, `quality-certificate-file`, `andon`, `closing`, `stage-start`, `reading-artifact`; `process.adapter.ts` and `released-work-order.adapter.ts` import no package and no `node:` module (grep over `factory/*/infrastructure/adapters`, seen 2026-11-28).
- The composition files (`factory/production.ts` 387 lines, `factory/quality.ts` 504, `factory/engineering.ts` 121, `factory/change-control.ts` 47) build those callbacks out of other modules' exports (seen 2026-11-28).
- The clean core's rules `acl-adapter-paired` and `adapter-implements-acl` require every ACL to have an adapter, which is what pushed internal ports into adapters (`schemas/shared/cores/clean-core/workstreams/adapters/adapters.rules.ts`, seen 2026-11-28).
- The clean core already shows a valid in-memory adapter, `in-memory-invoice.adapter.ts` (`adapters.examples.md:87`, seen 2026-11-28).

## Decisions

- The rule lives in the clean core, like the 2026-11-27 rules. `adapter-wraps-external-system` refuses an adapter file that imports no package, no `node:` module and no platform global and whose constructor takes a function. An in-memory adapter (state, no function parameter) stays valid. @by:agent
- An internal port is a repository interface of the consuming module whose implementation lives in `infrastructure/repository-implementations` and receives the other module's exported operation, validating its result with the consumer's ACL schema; no adapter and no ACL stand between them. `acl-adapter-paired` keeps applying to every ACL that remains. Discarded: keeping a forwarding adapter with an ACL; a port interface filled with a plain function in the composition root. @by:person
- The factory gains generic resource adapters in `shared/infrastructure/adapters` (files, process, HTTP where used) that execute what a repository states; module adapters that only wrap the disk or a process become contract adapters composing them. @by:agent
- Runs after `use-cases-branch-only-on-io` and before `factory-cli-through-controllers`, which rewires the composition files this change slims. @by:agent

## Open questions

## Architecture decisions

### Decision: internal-ports-composed-directly · An adapter wraps an external system; internal ports are composed

@modifies:internal-ports-composed-directly @base:2026-11-18-reparar-revision-semantica @area:product @topic:clean-core @applies:schemas,factory @enforced:adapter-wraps-external-system @by:person

An adapter SHALL wrap an external system (a package, an API, the disk, the environment) or an in-memory stand-in for one. The composition root SHALL connect an internal port such as change control to the production operation through the consumer's repository implementation, which validates the result with the consumer's contract and keeps its error semantics. The repository SHALL state the operation or query, a generic resource adapter SHALL execute it, and a contract adapter MAY compose a disk or HTTP adapter and transform the record with the contract schema.

**Why** Adapters that forwarded an internal callback, such as `ReleasedWorkOrderAdapter.readStarted()`, are not glue to anything external.

**Alternatives** Keeping internal callbacks as adapters.

**Consequences** A product's adapter that only forwards a function fails `factory check`; the valid HTTP, disk and in-memory cases are checked too.

## Procedures

## Screens

## Phases

### Phase 1: The factory composes its internal ports

**Seams**

```ts
// factory/change-control/infrastructure/repository-implementations/released-work-order.repository-implementation.ts
constructor(readStarted: () => Promise<unknown>); // validated with ReleasedWorkOrderRecordSchema
// factory/shared/infrastructure/adapters/: files.adapter.ts, process.adapter.ts
```

**Tests**

- The factory's tests keep passing; an integration test per internal port proves a malformed record from the other module is refused with the consumer's exception.

- [ ] Replace each forwarding adapter (`released-work-order`, `process`, and the callback parts of `plant`, `write-boundary`, `andon`, `closing`, `stage-start`, `reading-artifact`, `quality-certificate-file`) with its repository implementation receiving the operation, or with a contract adapter over a generic resource adapter
- [ ] Slim the composition files to wiring
- [ ] Verify the phase: `pnpm run check`

### Phase 2: The clean core holds the rule

**Seams**

```ts
// schemas/shared/cores/clean-core/workstreams/adapters/adapters.rules.ts
id: "adapter-wraps-external-system"
```

**Tests**

- The tests generated from `architecture/adapters`: the forwarding case breaks the rule, and the HTTP, disk and in-memory references break nothing.

- [ ] Write the rule, its cases in `adapters.examples.md`, record them with `pnpm exec factory expect adapters` and generate the tests
- [ ] Teach the internal port in the `adapters` and `infrastructure` skills
- [ ] Verify the phase: `pnpm run check`

## Feedback

## Next step
