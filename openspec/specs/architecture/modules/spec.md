# Keep the modules apart

## Purpose

Cross-module rules: isolation between modules (only `shared` is shared), cycles, no test living inside the product, and every file belonging to a zone. The architect applies them, not a layer builder.

It receives the modules (vertical slicing), each with its layers. It delivers `shared`: whatever two modules use.

Every rule is verified against the cases in `schemas/<schema>/workstreams/<workstream>/<layer>.examples.md`: under each rule, one case per way of breaking it, and a `reference` section. What the tools report on each case, file by file with the tools that reported it, is recorded in the case's `expect` block by `factory expect`, and every case is compared with that record. A case prefixed `todo.` is a known gap that the rule does not catch yet. The reference sections of the workstream and of the workstreams it depends on together form a correct module that breaks no rule of that workstream.

## Requirements

### Requirement: modules-are-isolated · modules do not import one another

A file in module A SHALL NOT import a file of module B; what two modules need lives in `shared`.

#### Scenario Outline: `<example>` breaks modules-are-isolated

- **GIVEN** the example `<example>` <!-- exampleFolder -->
- **WHEN** rule `<rule>` is checked <!-- ruleChecked -->
- **THEN** it is broken in the files the expectation records <!-- brokenAsExpected -->

##### Examples:

  | example                | rule                 |
  | ---------------------- | -------------------- |
  | imports-another-module | modules-are-isolated |

### Requirement: shared-imports-no-module · shared imports nothing from a module

A file in `shared` SHALL NOT import a file of any module.

#### Scenario Outline: `<example>` breaks shared-imports-no-module

- **GIVEN** the example `<example>` <!-- exampleFolder -->
- **WHEN** rule `<rule>` is checked <!-- ruleChecked -->
- **THEN** it is broken in the files the expectation records <!-- brokenAsExpected -->

##### Examples:

  | example               | rule                     |
  | --------------------- | ------------------------ |
  | shared-imports-module | shared-imports-no-module |

### Requirement: no-import-cycles · modules form no import cycles

The import graph of `src` SHALL have no cycles.

#### Scenario Outline: `<example>` breaks no-import-cycles

- **GIVEN** the example `<example>` <!-- exampleFolder -->
- **WHEN** rule `<rule>` is checked <!-- ruleChecked -->
- **THEN** it is broken in the files the expectation records <!-- brokenAsExpected -->

##### Examples:

  | example      | rule             |
  | ------------ | ---------------- |
  | import-cycle | no-import-cycles |

### Requirement: every-file-in-a-zone · every file of src belongs to a zone

Every file in `src` SHALL match the folder of some layer: no invented folders.

#### Scenario Outline: `<example>` breaks every-file-in-a-zone

- **GIVEN** the example `<example>` <!-- exampleFolder -->
- **WHEN** rule `<rule>` is checked <!-- ruleChecked -->
- **THEN** it is broken in the files the expectation records <!-- brokenAsExpected -->

##### Examples:

  | example                 | rule                 |
  | ----------------------- | -------------------- |
  | file-outside-every-zone | every-file-in-a-zone |

### Requirement: no-tests-in-src · src holds no test

No file in `src` SHALL be named `*.test.ts` or `*.spec.ts`: testing lives in `test/` by kind.

#### Scenario Outline: `<example>` breaks no-tests-in-src

- **GIVEN** the example `<example>` <!-- exampleFolder -->
- **WHEN** rule `<rule>` is checked <!-- ruleChecked -->
- **THEN** it is broken in the files the expectation records <!-- brokenAsExpected -->

##### Examples:

  | example         | rule            |
  | --------------- | --------------- |
  | test-inside-src | no-tests-in-src |

### Requirement: schema-package-only-at-boundaries · the schema package is imported only where shapes are declared

A file of the core SHALL import the schema package the configuration names only in `domain/schemas`, `infrastructure/acl` or `infrastructure/adapters`: a domain schema, an ACL shape or a raw resource shape. Entities, value objects, exceptions, use cases and repositories receive validated types and never parse.

#### Scenario Outline: `<example>` breaks schema-package-only-at-boundaries

- **GIVEN** the example `<example>` <!-- exampleFolder -->
- **WHEN** rule `<rule>` is checked <!-- ruleChecked -->
- **THEN** it is broken in the files the expectation records <!-- brokenAsExpected -->

##### Examples:

  | example                      | rule                              |
  | ---------------------------- | --------------------------------- |
  | schema-package-in-entity     | schema-package-only-at-boundaries |
  | schema-package-in-use-case   | schema-package-only-at-boundaries |
  | schema-package-in-repository | schema-package-only-at-boundaries |

### Requirement: no-any-in-core · the core declares no any

No file in `domain`, `application`, `infrastructure/repository-implementations` or `infrastructure/acl` SHALL use the `any` type: raw external data enters typed as unknown records in adapters and leaves the ACL validated. Adapters and the entry are the boundary and keep their freedom.

#### Scenario Outline: `<example>` breaks no-any-in-core

- **GIVEN** the example `<example>` <!-- exampleFolder -->
- **WHEN** rule `<rule>` is checked <!-- ruleChecked -->
- **THEN** it is broken in the files the expectation records <!-- brokenAsExpected -->

##### Examples:

  | example                | rule           |
  | ---------------------- | -------------- |
  | any-in-entity          | no-any-in-core |
  | any-in-repository      | no-any-in-core |
  | record-any-in-use-case | no-any-in-core |

### Requirement: no-raw-error-in-core · domain and application throw only domain exceptions

No file in `domain` or `application` SHALL contain `throw new Error(`: a business failure has a name, a domain exception that extends the common base and carries its cause.

#### Scenario Outline: `<example>` breaks no-raw-error-in-core

- **GIVEN** the example `<example>` <!-- exampleFolder -->
- **WHEN** rule `<rule>` is checked <!-- ruleChecked -->
- **THEN** it is broken in the files the expectation records <!-- brokenAsExpected -->

##### Examples:

  | example               | rule                 |
  | --------------------- | -------------------- |
  | raw-error-in-entity   | no-raw-error-in-core |
  | raw-error-in-use-case | no-raw-error-in-core |

### Requirement: no-harness-escapes · product code never switches the harness off

Product code SHALL NOT carry a directive that disables a lint rule, a comment that suppresses or expects a type error, or a cast that goes through the unknown type to reach another type.

#### Scenario Outline: `<example>` breaks no-harness-escapes

- **GIVEN** the example `<example>` <!-- exampleFolder -->
- **WHEN** rule `<rule>` is checked <!-- ruleChecked -->
- **THEN** it is broken in the files the expectation records <!-- brokenAsExpected -->

##### Examples:

  | example                     | rule               |
  | --------------------------- | ------------------ |
  | lint-rule-disabled          | no-harness-escapes |
  | type-error-suppressed       | no-harness-escapes |
  | type-error-expected         | no-harness-escapes |
  | cast-through-unknown        | no-harness-escapes |

### Requirement: A reference module satisfies every cross-module rule

The reference module of the workstream that owns this layer, assembled from the `## reference` sections of its example files and of the workstreams it depends on, SHALL break no rule of that workstream.

#### Scenario: `reference` breaks no rule

- **GIVEN** the example `reference` <!-- referenceFolder -->
- **WHEN** every rule of the workstream is checked <!-- workstreamChecked -->
- **THEN** no file breaks any rule <!-- noBrokenFiles -->
