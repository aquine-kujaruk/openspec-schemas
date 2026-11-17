## ADDED Requirements

### Requirement: unit-test-targets-core-file · unit tests target an existing file of the domain or the application

`@by:person`

Every file under `test/unit` SHALL be at `test/unit/<module>/<path>.test.ts`, where `<path>` starts with `domain/` or `application/` and `src/<module>/<path>.ts` exists: a unit test names the one file of the core it proves, and moves with it.

#### Scenario Outline: `<example>` breaks unit-test-targets-core-file

- **GIVEN** the example `<example>` <!-- exampleFolder -->
- **WHEN** rule `<rule>` is checked <!-- ruleChecked -->
- **THEN** it is broken in the files the expectation records <!-- brokenAsExpected -->

##### Examples:

  | example                    | rule                        |
  | -------------------------- | --------------------------- |
  | test-without-target        | unit-test-targets-core-file |
  | test-outside-module-folder | unit-test-targets-core-file |
  | test-of-infrastructure     | unit-test-targets-core-file |

### Requirement: unit-imports-only-the-core · unit tests import only the domain and the application

`@by:person`

A file under `test/unit` SHALL import nothing of the product but its domain and its application: never infrastructure, adapters or the entry. Whatever needs a resource is proved by an integration test.

#### Scenario Outline: `<example>` breaks unit-imports-only-the-core

- **GIVEN** the example `<example>` <!-- exampleFolder -->
- **WHEN** rule `<rule>` is checked <!-- ruleChecked -->
- **THEN** it is broken in the files the expectation records <!-- brokenAsExpected -->

##### Examples:

  | example                                | rule                       |
  | -------------------------------------- | -------------------------- |
  | test-imports-adapter                   | unit-imports-only-the-core |
  | test-imports-repository-implementation | unit-imports-only-the-core |

### Requirement: A reference module satisfies the unit rules

`@by:agent`

The reference module of the workstream that owns this layer, assembled from the `## reference` sections of its example files and of the workstreams it depends on, SHALL break no rule of that workstream.

#### Scenario: `reference` breaks no rule

- **GIVEN** the example `reference` <!-- referenceFolder -->
- **WHEN** every rule of the workstream is checked <!-- workstreamChecked -->
- **THEN** no file breaks any rule <!-- noBrokenFiles -->
