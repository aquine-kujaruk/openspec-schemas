# architecture/unit Specification

## Purpose
Unit tests: one hand-written Vitest file per domain or application file that needs proving apart from the use cases, at `test/unit/<module>/<path>.test.ts`, mirroring the path of the file it tests. Nothing is faked: a unit test exercises the domain and the application directly and never reaches a resource; what needs one is proved by an integration test, and the whole by acceptance. They are written by the workstream that owns domain and application and run with `factory test unit`, outside `factory check`.

Every rule is verified against the cases in `schemas/<schema>/workstreams/<workstream>/<layer>.examples.md`: under each rule, one case per way of breaking it, and a `reference` section. What the tools report on each case, file by file with the tools that reported it, is recorded in the case's `expect` block by `factory expect`, and every case is compared with that record. A case prefixed `todo.` is a known gap that the rule does not catch yet. The reference sections of the workstream and of the workstreams it depends on together form a correct module that breaks no rule of that workstream.

## Requirements

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
