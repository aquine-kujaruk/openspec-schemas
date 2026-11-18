# tests

### Decision: unit-tests-mirror-the-core · Unit tests live in test/unit and mirror the core file they test

@origin:2026-11-17-unit-test-zone @applies:schemas,factory @enforced:unit-test-targets-core-file,unit-imports-only-the-core @by:person

In a schema built on the clean core, a unit test SHALL live at `<unit>/<module>/<path>.test.ts`, where `<modules>/<module>/<path>.ts` exists and `<path>` starts with `domain/` or `application/`. It SHALL import only the domain and application of the product and its test runner, never infrastructure, adapters or the entry. No test SHALL live under the module root.

**Why** The person wants every test placed by a rule, never where it falls: acceptance and integration already are, and unit tests are the kind a module may need beside acceptance.

### Decision: semantic-acceptance-independent-of-evaluator · Acceptance declares the expected verdict

@origin:2026-11-18-independizar-aceptacion-del-modelo @applies:acceptance,toolkit @enforced:architecture/linting @by:person

Semantic acceptance cases SHALL declare the expected answer independently of any evaluator. The selected evaluator SHALL come from configuration. Model identity, raw probabilities and fingerprints SHALL belong to execution evidence.

**Why** The expected verdict describes the rule. A change in evaluator calls for new measurements of the same cases.
