---
name: domain-contracts-and-topology
description: The factory's domain names every class by its role, validates every schema at runtime, folds single-value value objects into their owners and lets the Process aggregate own ordering and cycles; three clean-core rules hold the first three for every product.
created_at: 2026-11-27
created_by: Edgar
approved_at: 2026-11-27
schema: spec-plan
---

# The domain names its roles, validates its contracts and owns its topology

## Goal

The factory's domain reads the way the clean core's reference writes a domain: every entity, aggregate and value object carries its role in its exported name, every schema file exports a runtime schema, a value object holds a coherent set of values, and one calculation in the `Process` aggregate orders work centers and finds their cycles for the domain and the runtime loader alike. Three rules of the clean core (`class-name-carries-role`, `schema-validates-at-runtime`, `value-object-holds-several-values`) fail `factory check` in this repository and in every product that breaks them, so the agent cannot generate the old shape again. The decisions `domain-contracts-execute` and `process-owns-topology` stop being `@enforced:pending`.

## Findings

- 34 exported classes under `factory/*/domain/{entities,aggregates,value-objects}` lack the role their file names (`Plant` in `plant.entity.ts`, `Process` in `process.aggregate.ts`, `LineName` in `line-name.value-object.ts`); every class under `application` and `infrastructure` already carries it (grep over `export class`, seen 2026-11-27).
- The clean core's reference and scaffolds already name them `InvoiceEntity`, `InvoiceBookAggregate`, `<Name>ValueObject`, and the `app-domain` skill asks to "name exported classes for their architectural role"; no rule checks it (`schemas/shared/cores/clean-core/workstreams/app-domain/domain.examples.md`, `SKILL.md`, seen 2026-11-27).
- 10 of the 46 domain schema files export no runtime schema, only TypeScript types: `write-boundary`, `equipment-reading`, `procedure-reading`, `plan-document`, `configuration`, `line-types`, `platform`, `audit-material`, `audit-settings`, `inspect-work-order` (`grep -L 'from "zod"'`, seen 2026-11-27). `line-types.schema.ts` (296 lines) holds the SDK's contracts, some of them functions (`Layer.archunit`).
- 6 value objects hold one value: `LineName`, `ProcessName` (shared), `WorkCenterId`, `StandardId` (engineering), `WorkOrderName`, `Decision` (production), used in about 68 files (count of fields in each schema, seen 2026-11-27).
- `Process` computes `executionOrder`, `prerequisites` and `mayRunTogether` over its work centers, while `WorkCenterTopologyService` walks the configured topology again in `loadWorkstreams`, `findCycle`, `upstream`, `runOrder`, `mayRunTogether` and `withUpstream` (`factory/engineering/domain/aggregates/process.aggregate.ts`, `factory/engineering/domain/services/work-center-topology.service.ts`, seen 2026-11-27).
- The rubric of the clean core already asks S17 (a value object that is a bare wrapper) and S12 (a service doing what an aggregate should) in review; neither is a deterministic check (`schemas/shared/cores/clean-core/review/RUBRIC.md`, seen 2026-11-27).
- `package.json` is at 0.15.3 (seen 2026-11-27).

## Decisions

- This change is the first of three agreed in the hash-it-out of 2026-11-27: domain first, then use cases, then composition; discarded: one change per decision and one change with three phases. @by:person
- The rules live in the clean core, so they fail `factory check` here and in every product built with `backend`, `frontend` or `fullstack`; discarded: rules only for the factory, and review only. @by:person
- The person approved this plan by approving the hash-it-out synthesis of 2026-11-27, which approves the three plans written from it. @by:person
- `schema-validates-at-runtime` asks for at least one exported `XSchema` constant in each domain schema file; a type that describes a function (`Layer.archunit`) may stay hand-written next to it. Discarded: requiring every exported type to be `z.infer`, which a function type cannot meet. The shared validation helper (`validation.schema.ts`, which exports `validateSchema`) is exempt. @by:agent
- `value-object-holds-several-values` counts the top-level keys of the `z.object` the value object validates with and asks for two or more; discarded: a review question only, since S17 already asks it and the person wants a check. @by:agent
- A single-value value object becomes a validated field of its owner's schema (`name: z.string().min(1)`), and the code compares plain strings; discarded: keeping them as wrappers with a method. @by:person
- The configured workstream topology becomes a `ProcessAggregate` built from the declarations, so the loader asks the aggregate for the run order, the upstream of a center, whether two may run together and the cycle; `WorkCenterTopologyService` is removed. Discarded: keeping the service as a façade over the aggregate. @by:agent
- The version goes to 0.16.0: a product that breaks a new rule fails its check after updating. @by:agent
- The repository's checks run as `pnpm run check`; the phase verify is that command. @by:agent

## Open questions

## Architecture decisions

### Decision: domain-contracts-execute · A schema in the domain validates at runtime

@modifies:domain-contracts-execute @base:2026-11-18-reparar-revision-semantica @area:product @topic:clean-core @applies:schemas,factory @enforced:schema-validates-at-runtime,class-name-carries-role @by:person

A domain contract named as a schema SHALL be an executable validation with its inferred type, reused at the boundary when the shapes match. A class SHALL carry its role in its exported name as well as in its file name.

**Why** TypeScript-only aliases in schema files passed for validation, and 34 domain classes lacked the role their scaffold names.

**Alternatives** Review only (S-rows of the rubric): it let the factory itself drift.

**Consequences** A product with a type-only schema file, or a class whose name lacks its role, fails `factory check`.

### Decision: process-owns-topology · The Process aggregate owns ordering and cycles

@modifies:process-owns-topology @base:2026-11-18-reparar-revision-semantica @area:product @topic:clean-core @applies:schemas,factory @enforced:value-object-holds-several-values,process-aggregate-unit-test @by:person

A work center SHALL describe its direct dependencies; the Process aggregate SHALL own ordering and cycle detection across centers, and both the runtime loader and the domain SHALL use that one calculation. Value objects of a single value SHALL become validated fields of their owner's schema.

**Why** `WorkCenter` was anemic while `Process` and `WorkCenterTopologyService` each traversed the graph; `WorkCenterId` and `StandardId` wrap a string.

**Alternatives** A topology service shared by both, discarded because the aggregate already holds the work centers.

**Consequences** A product's value object with one value fails `factory check`. The unit test `test/unit/engineering/domain/aggregates/process.aggregate.test.ts` proves the loader's order and cycle through the aggregate.

## Procedures

## Screens

## Phases

### Phase 1: The factory's domain reads as the reference

**Seams**

```ts
// factory/engineering/domain/aggregates/process.aggregate.ts
export class ProcessAggregate {
  executionOrder(): WorkCenterEntity[];
  prerequisites(id: string): WorkCenterEntity[];
  mayRunTogether(left: string, right: string): boolean;
  cycle(): string[] | undefined;
}
// every class under factory/*/domain/{entities,aggregates,value-objects} ends in Entity | Aggregate | ValueObject
```

**Tests**

- The factory's unit, integration and acceptance tests keep passing with the renamed classes and the folded value objects; `process.aggregate.test.ts` adds the loader's cases (run order, upstream, a cycle named in the error).

- [ ] Rename every role-less class of the factory's domain to carry its role, and update its imports across `factory/`, `test/`, `schemas/` and `tools/`
- [ ] Fold `LineName`, `ProcessName`, `WorkCenterId`, `StandardId`, `WorkOrderName` and `Decision` into validated string fields of their owners' schemas, and remove their files
- [ ] Give each of the 10 type-only schema files an exported runtime schema for the data it describes, its types inferred from it where the shapes match
- [ ] Move ordering, upstream, parallelism and cycle detection of the workstream topology into `ProcessAggregate`, make the loader use it, remove `WorkCenterTopologyService`, and cover it in `process.aggregate.test.ts`
- [ ] Verify the phase: `pnpm run check`

### Phase 2: The clean core holds the three rules

**Seams**

```ts
// schemas/shared/cores/clean-core/workstreams/app-domain/domain.rules.ts: three new archunit rules
id: "class-name-carries-role"            // entities → XEntity, aggregates → XAggregate, value-objects → XValueObject
id: "schema-validates-at-runtime"        // every domain schema file exports `const XSchema`
id: "value-object-holds-several-values"  // a value object's z.object has two or more keys
```

**Tests**

- The tests generated from `architecture/domain`: each new case of `domain.examples.md` breaks its rule in the files its `expect` block records, and the reference breaks none.
- `factory check` over this repository passes with the new rules.

- [ ] Write the three rules in `domain.rules.ts`
- [ ] Add one case per way of breaking each rule to `domain.examples.md` and record each `expect` block with `pnpm exec factory expect domain`
- [ ] Generate the tests of the delta spec with `pnpm exec factory generate`
- [ ] Name the three rules in the `app-domain` skill, and raise `package.json` to 0.16.0
- [ ] Verify the phase: `pnpm run check`

## Feedback

## Next step
