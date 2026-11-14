# Write the acceptance tests

## Purpose

Acceptance tests: a black box against the use cases, with fake in-memory repositories behind the repository interfaces. There are no layers inside: only the contexts (modules) and the use cases they have. Each test is generated from the product spec of its use case (`openspec/specs/<module>/<use-case>/spec.md`); the implementer writes the step adapter next to it, and the in-memory repository of the module in `repositories/`. They run with `factory test acceptance`, outside `factory check`.

It receives from the product spec the expected behavior of the use case, and from application `XUseCase.execute(args)`, its exceptions and the `XRepositoryInterface` contract it fakes. It never imports infrastructure. It delivers `test/acceptance/<module>/<use-case>.feature.steps.ts` for every use case; the generated `<use-case>.feature.test.ts` comes from `factory generate`.

Every rule is verified against the cases in `workstreams/<workstream>/<layer>.examples.md`: under each rule, one case per way of breaking it, and a `reference` section. What the tools report on each case, file by file with the tools that reported it, is recorded in the case's `expect` block by `factory expect`, and every case is compared with that record. A case prefixed `todo.` is a known gap that the rule does not catch yet. The reference sections of the workstream and of the workstreams it depends on together form a correct module that breaks no rule of that workstream.

## Requirements

### Requirement: acceptance-test-targets-use-case · acceptance tests target an existing use case

Every file under `test/acceptance` SHALL be `<module>/<x>.feature.steps.ts`, `<module>/<x>.feature.test.ts` or `<module>/repositories/in-memory-<name>.repository.ts`. For every `<x>`, the product spec `<module>/<x>` under the configured product specs root and `src/<module>/application/use-cases/<x>.use-case.ts` SHALL exist: spec, steps and use case are one behavior, and a hand-written test has no spec behind it.

#### Scenario Outline: `<example>` breaks acceptance-test-targets-use-case

- **GIVEN** the example `<example>` <!-- exampleFolder -->
- **WHEN** rule `<rule>` is checked <!-- ruleChecked -->
- **THEN** it is broken in the files the expectation records <!-- brokenAsExpected -->

##### Examples:

  | example                     | rule                             |
  | --------------------------- | -------------------------------- |
  | steps-without-use-case      | acceptance-test-targets-use-case |
  | steps-without-spec          | acceptance-test-targets-use-case |
  | hand-written-test           | acceptance-test-targets-use-case |
  | test-outside-module-folder  | acceptance-test-targets-use-case |
  | helper-outside-repositories | acceptance-test-targets-use-case |

### Requirement: acceptance-repository-is-a-repository · acceptance repositories are repositories of their module

Every file in `test/acceptance/<module>/repositories` SHALL be `in-memory-<name>.repository.ts` and SHALL declare `InMemory<Name>Repository` implementing `<Name>RepositoryInterface` imported from `src/<module>/application/repository-interfaces/<name>.repository-interface`, with a constructor that declares no parameter: the double is a repository like the one that will be generated, and it builds no anti-corruption layer.

#### Scenario Outline: `<example>` breaks acceptance-repository-is-a-repository

- **GIVEN** the example `<example>` <!-- exampleFolder -->
- **WHEN** rule `<rule>` is checked <!-- ruleChecked -->
- **THEN** it is broken in the files the expectation records <!-- brokenAsExpected -->

##### Examples:

  | example                          | rule                                  |
  | -------------------------------- | ------------------------------------- |
  | repository-without-interface     | acceptance-repository-is-a-repository |
  | repository-with-constructor-args | acceptance-repository-is-a-repository |
  | repository-misnamed              | acceptance-repository-is-a-repository |

### Requirement: acceptance-throws-domain-exceptions · acceptance throws no raw error

No file under `test/acceptance` SHALL contain `throw new Error(`, and every `throw new X(` in `test/acceptance/<module>/repositories` SHALL construct a class imported from `src/<module>/domain/exceptions`: steps check their data with assertions, and a test repository fails the way the real one does.

#### Scenario Outline: `<example>` breaks acceptance-throws-domain-exceptions

- **GIVEN** the example `<example>` <!-- exampleFolder -->
- **WHEN** rule `<rule>` is checked <!-- ruleChecked -->
- **THEN** it is broken in the files the expectation records <!-- brokenAsExpected -->

##### Examples:

  | example                            | rule                                |
  | ---------------------------------- | ----------------------------------- |
  | steps-throw-raw-error              | acceptance-throws-domain-exceptions |
  | repository-throws-foreign-exception | acceptance-throws-domain-exceptions |

### Requirement: A reference module satisfies the acceptance rules

The reference module of the workstream that owns this layer, assembled from the `## reference` sections of its example files and of the workstreams it depends on, SHALL break no rule of that workstream.

#### Scenario: `reference` breaks no rule

- **GIVEN** the example `reference` <!-- referenceFolder -->
- **WHEN** every rule of the workstream is checked <!-- workstreamChecked -->
- **THEN** no file breaks any rule <!-- noBrokenFiles -->
