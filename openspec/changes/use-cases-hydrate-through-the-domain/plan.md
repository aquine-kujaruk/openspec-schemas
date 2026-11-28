---
name: use-cases-hydrate-through-the-domain
description: Repositories return validated records and the use case hydrates them once through a factory of the domain, which owns the error for a missing required part; a clean-core rule refuses a repository that builds domain objects.
created_at: 2026-11-28
created_by: Edgar
approved_at: 2026-11-28
schema: spec-plan
---

# Use cases hydrate through the domain

## Goal

Every repository implementation of the factory and of every clean-core product returns validated records, and the use case turns them into the complete aggregate with one call to a factory of the domain. A missing required part fails in the domain with the same error whoever asks. The rule `repository-returns-records` fails `factory check` on a repository that builds an entity, aggregate or value object, and the decision `domain-hydrates-through-factory` stops being `@enforced:pending`.

## Findings

- `PlantRepositoryImplementation.getPlant()` builds `PlantEntity`, `LineEntity` and `LineRootsValueObject`; `PrepareLineUseCase` then throws `Unknown line` itself when `findLine` returns nothing (`factory/engineering/infrastructure/repository-implementations/plant.repository-implementation.ts`, `factory/engineering/application/use-cases/prepare-line.use-case.ts`, seen 2026-11-28).
- 6 repository implementations build domain objects: `process`, `equipment`, `plant`, `work-order`, `inspection` and `drawing` (`grep -lE "new \w+(Entity|Aggregate)\("` under `factory/*/infrastructure/repository-implementations`, seen 2026-11-28).
- Rubric rows S05 (a repository returns primitives or schema props) and S19 (the use case hydrates) already ask this, as review warnings that never fail `factory check` (`schemas/shared/cores/clean-core/review/RUBRIC.md`, seen 2026-11-28).
- Precedent: on 2026-11-27 the person put the domain rules in the clean core, so they hold for every product, not only the factory (`openspec/changes/archive/2026-11-27-domain-contracts-and-topology/plan.md`).

## Decisions

- The rule lives in the clean core, like the three rules of 2026-11-27, so every product built with `backend`, `frontend` or `fullstack` is held by it and learns it through `factory doctor`. @by:agent
- `repository-returns-records` refuses `new X(Entity|Aggregate|ValueObject)(` and imports from `domain/{entities,aggregates,value-objects}` in `infrastructure/repository-implementations`; S05 stays as the review of what the rule cannot see. Discarded: review only. @by:agent
- The domain factory is a static method `from(record)` on the aggregate or entity it builds, since S12 puts a static method before a domain service. Discarded: a `domain/factories` folder, a new vocabulary for one method. @by:person
- A lookup that a caller may miss stays optional (`findLine`); the required lookup (`lineNamed`) throws the domain exception. @by:agent
- Runs after `doctor-reports-changed-rules`, so products learn the new rule through doctor. @by:agent

## Open questions

## Architecture decisions

### Decision: domain-hydrates-through-factory · The use case hydrates once through a domain factory

@modifies:domain-hydrates-through-factory @base:2026-11-18-reparar-revision-semantica @area:product @topic:clean-core @applies:schemas,factory @enforced:repository-returns-records,required-part-throws-in-domain @by:person

A repository SHALL return validated records, and the use case SHALL call a static factory of the domain once to obtain the complete aggregate. The domain SHALL own the error for a missing required part, and SHALL keep the optional lookup for callers that accept absence.

**Why** `PlantRepositoryImplementation` built `PlantEntity` and `PrepareLineUseCase` handled a missing line itself.

**Alternatives** Hydrating in the repository: rows S05 and S19 already refused it, and only as warnings.

**Consequences** A product whose repository builds a domain object fails `factory check`; a missing required line produces the same domain error from every caller.

## Procedures

## Screens

## Phases

### Phase 1: The factory hydrates in the domain

**Seams**

```ts
// factory/shared/domain/entities/plant.entity.ts
static from(record: PlantRecord): PlantEntity;
lineNamed(name: string): LineEntity; // throws the domain exception
// every repository-implementation returns records parsed by its ACL schema
```

**Tests**

- The factory's tests keep passing; a unit test proves `lineNamed` throws the same exception for every caller.

- [ ] Give each of the six repositories' aggregates a static `from(record)` and make the repositories return records
- [ ] Make each use case hydrate once through it, and move the required-part errors into the domain
- [ ] Verify the phase: `pnpm run check`

### Phase 2: The clean core holds the rules

**Seams**

```ts
// schemas/shared/cores/clean-core/workstreams/infrastructure/infrastructure.rules.ts
id: "repository-returns-records"      // no domain object built or imported in repository-implementations
// schemas/shared/cores/clean-core/workstreams/app-domain/application.rules.ts
id: "required-part-throws-in-domain"  // no `if (!x) throw` on a value read from a repository in a use case
```

**Tests**

- The tests generated from `architecture/infrastructure` and `architecture/application`: each case breaks the rule in the files its `expect` block records, and the reference breaks nothing.

- [ ] Write both rules, their cases in `infrastructure.examples.md` and `application.examples.md`, record them with `pnpm exec factory expect` and generate the tests
- [ ] Update the reference module and the `infrastructure` and `app-domain` skills
- [ ] Verify the phase: `pnpm run check`

## Feedback

## Next step
