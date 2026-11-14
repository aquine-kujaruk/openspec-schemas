---
name: app-domain
description: Build the app-domain workstream of the implementer: the acceptance step adapters, the application layer (use cases, repository interfaces) and the domain layer, with repositories faked in memory. Read from the implement skill.
---

# app-domain

**Owns:** `test/acceptance/<module>/` (one step adapter per use case, next to the test generated from its product spec), `src/<module>/application/` (use cases and repository interfaces) and `src/<module>/domain/` (entities, aggregates, value objects, schemas, exceptions, services).

**Receives:** the product specs, one per use case under the configured product specs root (`openspec/specs/<module>/<use-case>/spec.md` by default), and nothing from other workstreams. The repository interfaces it declares are seams that `infrastructure` implements. The change's design defines them (which methods, which props and exceptions), and the implementer fixes them before this workstream starts.

**Fakes:** repositories, and only them. Acceptance is a black box against the use case. Each repository the use cases need has an in-memory twin in `test/acceptance/<module>/repositories/in-memory-<name>.repository.ts`: `class InMemory<Name>Repository implements <Name>RepositoryInterface`, with no constructor parameter and a `seed(...)` method the Given steps call. It behaves like the one infrastructure will build: same contract, same exceptions of the module family. It never imports from `infrastructure`.

## How

1. Read the `## reference` sections of `acceptance.examples.md`, `application.examples.md` and `domain.examples.md`: they are the shape of correct code. The other sections show each way of breaking a rule.
2. `pnpm exec factory generate`: each product spec becomes `test/acceptance/<module>/<use-case>.feature.test.ts` and a step adapter `<use-case>.feature.steps.ts` with a pending method per step. Never write or edit a test file; a behavior the spec lacks goes back as feedback on the change.
3. Write the in-memory repositories, fill the step adapter of each use case, then write the use case and the domain it needs, until `pnpm exec factory test acceptance` is green. A step method keeps its parameter names equal to the spec's placeholders, or the next generation scaffolds it again. Steps check their data with assertions (`expect`), never `throw new Error(`; the `PENDING` bodies feat2test scaffolds break that rule, so the pipeline is red until every step is written.
4. The module's exceptions are the family the design declares: one base extending `DomainException`, one subclass per business failure.
5. Follow the core-wide rules even though `clean-architecture` checks them: no `any` in the core, only domain exceptions (the provider error in `cause`), the schema package only in `domain/schemas`.

**Check:** `pnpm exec factory check --workstream app-domain [--module <module>]`, plus `pnpm exec factory test acceptance`.
