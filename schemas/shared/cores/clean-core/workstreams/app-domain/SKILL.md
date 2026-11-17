---
name: app-domain
description: Build the app-domain workstream of the implementer: the acceptance step adapters, unit tests, the application layer (use cases, repository interfaces) and the domain layer, with repositories faked in memory. Read from the implement skill.
---

# app-domain

**Owns:** `test/acceptance/<module>/` (one step adapter per use case, next to the test generated from its product spec), `src/<module>/application/` (use cases and repository interfaces), `test/unit/<module>/` (hand-written tests mirroring domain or application files), and `src/<module>/domain/` (entities, aggregates, value objects, schemas, exceptions, services).

**Paths:** every path here is written at the defaults. In a project with products, it sits in the folder of the change's product and under that product's configured roots (`pnpm exec factory schemas` lists each product's folder): `src` stands for the module root, `test/acceptance`, `test/integration` and `test/unit` for their test roots, and `openspec/specs/<module>` for `openspec/specs/<product>/<module>`. A scaffold's info string stays as written; only `mkdir -p` and `-o` take the product's path.

**Receives:** the product specs, one per use case under the configured product specs root (`openspec/specs/<module>/<use-case>/spec.md` by default), and nothing from other workstreams. The repository interfaces it declares are seams that `infrastructure` implements. The change's design defines them (which methods, which props and exceptions), and the implementer fixes them before this workstream starts.

**Fakes:** repositories, and only them. Acceptance is a black box against the use case. Each repository the use cases need has an in-memory twin in `test/acceptance/<module>/repositories/in-memory-<name>.repository.ts`: `class InMemory<Name>Repository implements <Name>RepositoryInterface`, with no constructor parameter and a `seed(...)` method the Given steps call. It behaves like the one infrastructure will build: same contract, same exceptions of the module family. It never imports from `infrastructure`.

## How

1. Read the `## reference` sections of `acceptance.examples.md`, `application.examples.md`, `domain.examples.md` and `unit.examples.md`: they are the shape of correct code. The other sections show each way of breaking a rule.
2. Start every file of the kinds below from its scaffold, then fill it in; never write one of them from nothing. `<ref>` is the folder this skill is in, `<Name>` and `<name>` the name in PascalCase and kebab-case, and the configured roots replace `src` and `test/acceptance`:
   ```bash
   # schema
   mkdir -p src/<module>/domain/schemas && pnpm dlx ejs@7.0.2 <(sed -n '\#^```ejs src/<module>/domain/schemas/<name>.schema.ts$#,/^```$/{//!p}' <ref>/domain.examples.md) -o src/<module>/domain/schemas/<name>.schema.ts Name=<Name> name=<name> module=<module>
   # entity
   mkdir -p src/<module>/domain/entities && pnpm dlx ejs@7.0.2 <(sed -n '\#^```ejs src/<module>/domain/entities/<name>.entity.ts$#,/^```$/{//!p}' <ref>/domain.examples.md) -o src/<module>/domain/entities/<name>.entity.ts Name=<Name> name=<name> module=<module>
   # value object
   mkdir -p src/<module>/domain/value-objects && pnpm dlx ejs@7.0.2 <(sed -n '\#^```ejs src/<module>/domain/value-objects/<name>.value-object.ts$#,/^```$/{//!p}' <ref>/domain.examples.md) -o src/<module>/domain/value-objects/<name>.value-object.ts Name=<Name> name=<name> module=<module>
   # exception family
   mkdir -p src/<module>/domain/exceptions && pnpm dlx ejs@7.0.2 <(sed -n '\#^```ejs src/<module>/domain/exceptions/<name>.exceptions.ts$#,/^```$/{//!p}' <ref>/domain.examples.md) -o src/<module>/domain/exceptions/<name>.exceptions.ts Name=<Name> name=<name> module=<module>
   # in-memory repository
   mkdir -p test/acceptance/<module>/repositories && pnpm dlx ejs@7.0.2 <(sed -n '\#^```ejs test/acceptance/<module>/repositories/in-memory-<name>.repository.ts$#,/^```$/{//!p}' <ref>/acceptance.examples.md) -o test/acceptance/<module>/repositories/in-memory-<name>.repository.ts Name=<Name> name=<name> module=<module>
   ```
   The `shared` bases these files import, and the repository interfaces, are seams: they already exist, rendered from their scaffolds before this workstream started.
3. `pnpm exec factory generate`: each product spec becomes `test/acceptance/<module>/<use-case>.feature.test.ts` and a step adapter `<use-case>.feature.steps.ts` with a pending method per step. Never write or edit a generated test file; a behavior the spec lacks goes back as feedback on the change.
4. Write the in-memory repositories, fill the step adapter of each use case, then write the use case and the domain it needs, until `pnpm exec factory test acceptance` is green. A step method keeps its parameter names equal to the spec's placeholders, or the next generation scaffolds it again. Steps check their data with assertions (`expect`), never `throw new Error(`; the `PENDING` bodies feat2test scaffolds break that rule, so the pipeline is red until every step is written.
5. Write each unit test at `test/unit/<module>/<path>.test.ts`, mirroring an existing `src/<module>/<path>.ts` in `domain/` or `application/`. Exercise the core directly, importing only domain, application and the test runner; use integration tests for resources. Run `pnpm exec factory test unit` until it passes.
6. The module's exceptions are the family the design declares: one base extending `DomainException`, one subclass per business failure.
7. Follow the core-wide rules even though `modules` checks them: no `any` in the core, only domain exceptions (the provider error in `cause`), the schema package only in `domain/schemas`.

**Check:** `pnpm exec factory check --workstream app-domain [--module <module>]`, plus `pnpm exec factory test acceptance` and `pnpm exec factory test unit`.
