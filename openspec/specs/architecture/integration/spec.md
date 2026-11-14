# Write the integration tests

## Purpose

Integration tests: the repository implementation between the repository interface and the anti-corruption layer, exercised over an in-memory adapter that implements the real ACL (its interface and its record schemas). Nothing here is faked but the resource: the ACL is the product's, the repository implementation is the product's. One hand-written Vitest file per repository implementation, `test/integration/<module>/<x>-repository.test.ts`, written by the workstream that owns infrastructure. They run with `factory test integration`, outside `factory check`.

It receives from infrastructure `XRepositoryImplementation` and `XAcl` with its record schemas, from application the `XRepositoryInterface` it must honor, and from domain the `XProps` it returns and the exceptions it throws. The design of the change fixes those seams and the record → props mapping; the test invents its records inside the schema, guided by the Examples of the use cases where they overlap.

Every rule is verified against the cases in `schemas/<schema>/workstreams/<workstream>/<layer>.examples.md`: under each rule, one case per way of breaking it, and a `reference` section. What the tools report on each case, file by file with the tools that reported it, is recorded in the case's `expect` block by `factory expect`, and every case is compared with that record. A case prefixed `todo.` is a known gap that the rule does not catch yet. The reference sections of the workstream and of the workstreams it depends on together form a correct module that breaks no rule of that workstream.

## Requirements

### Requirement: integration-test-targets-repository-implementation · integration tests target an existing repository implementation

Every file under `test/integration` SHALL be at `test/integration/<module>/<x>-repository.test.ts`, and `src/<module>/infrastructure/repository-implementations/<x>.repository-implementation.ts` SHALL exist: the test proves the glue between interface and ACL, so it names the implementation it proves.

#### Scenario Outline: `<example>` breaks integration-test-targets-repository-implementation

- **GIVEN** the example `<example>` <!-- exampleFolder -->
- **WHEN** rule `<rule>` is checked <!-- ruleChecked -->
- **THEN** it is broken in the files the expectation records <!-- brokenAsExpected -->

##### Examples:

  | example                           | rule                                             |
  | --------------------------------- | ------------------------------------------------ |
  | test-without-implementation       | integration-test-targets-repository-implementation |
  | test-outside-module-folder        | integration-test-targets-repository-implementation |
  | test-without-repository-suffix    | integration-test-targets-repository-implementation |

### Requirement: A reference module satisfies the integration rules

The reference module of the workstream that owns this layer, assembled from the `## reference` sections of its example files and of the workstreams it depends on, SHALL break no rule of that workstream.

#### Scenario: `reference` breaks no rule

- **GIVEN** the example `reference` <!-- referenceFolder -->
- **WHEN** every rule of the workstream is checked <!-- workstreamChecked -->
- **THEN** no file breaks any rule <!-- noBrokenFiles -->
