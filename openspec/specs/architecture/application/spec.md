# Build the application layer

## Purpose

Use case and repository interface. The application layer is the entry to the core and the contract that survives if the delivery mechanism (a UI, an HTTP API, a BFF) is rebuilt: it decides _what happens_. It only imports domain. Its two seams are the only ones in the model: the interfaces towards infrastructure (`repository-implements-interface`) and the use cases towards the entry, which composes them.

It receives from domain the entities, schemas and exceptions, and from the problem the flows (what the user can do). It delivers to infrastructure `export interface XRepositoryInterface` in `repository-interfaces/x.repository-interface.ts`, with methods named verb plus noun that return schema props or primitives, and to the entry `export class XUseCase { constructor(repository interfaces and use cases...); execute(args) }`, which hydrates props into domain and throws business exceptions.

Every rule is verified against the cases in `schemas/<schema>/workstreams/<workstream>/<layer>.examples.md`: under each rule, one case per way of breaking it, and a `reference` section. What the tools report on each case, file by file with the tools that reported it, is recorded in the case's `expect` block by `factory expect`, and every case is compared with that record. A case prefixed `todo.` is a known gap that the rule does not catch yet. The reference sections of the workstream and of the workstreams it depends on together form a correct module that breaks no rule of that workstream.

## Requirements

### Requirement: application-vocabulary · application is a closed vocabulary

The application layer SHALL contain only the folders `use-cases` and `repository-interfaces`, with files `*.use-case.ts` and `*.repository-interface.ts`.

#### Scenario Outline: `<example>` breaks application-vocabulary

- **GIVEN** the example `<example>` <!-- exampleFolder -->
- **WHEN** rule `<rule>` is checked <!-- ruleChecked -->
- **THEN** it is broken in the files the expectation records <!-- brokenAsExpected -->

##### Examples:

  | example                   | rule                   |
  | ------------------------- | ---------------------- |
  | folder-outside-vocabulary | application-vocabulary |
  | wrong-suffix              | application-vocabulary |
  | services-folder           | application-vocabulary |

### Requirement: use-case-is-class-with-execute · application use cases are classes with execute()

Every file in `use-cases` SHALL export a class named `XUseCase` with an `execute()` method and its dependencies injected through the constructor.

#### Scenario Outline: `<example>` breaks use-case-is-class-with-execute

- **GIVEN** the example `<example>` <!-- exampleFolder -->
- **WHEN** rule `<rule>` is checked <!-- ruleChecked -->
- **THEN** it is broken in the files the expectation records <!-- brokenAsExpected -->

##### Examples:

  | example           | rule                           |
  | ----------------- | ------------------------------ |
  | no-use-case-class | use-case-is-class-with-execute |

### Requirement: repository-contract-is-interface · application repository contracts are exported interfaces

Every file in `application/repository-interfaces` SHALL export `interface XRepositoryInterface`, named after its file (`x.repository-interface.ts`) and without an `I` prefix; the interface is the seam infrastructure implements.

#### Scenario Outline: `<example>` breaks repository-contract-is-interface

- **GIVEN** the example `<example>` <!-- exampleFolder -->
- **WHEN** rule `<rule>` is checked <!-- ruleChecked -->
- **THEN** it is broken in the files the expectation records <!-- brokenAsExpected -->

##### Examples:

  | example         | rule                             |
  | --------------- | -------------------------------- |
  | no-interface    | repository-contract-is-interface |
  | prefixed-with-i | repository-contract-is-interface |

### Requirement: application-imports-only-domain · application imports only domain

An application file SHALL import only domain and application files: never infrastructure or the entry.

#### Scenario Outline: `<example>` breaks application-imports-only-domain

- **GIVEN** the example `<example>` <!-- exampleFolder -->
- **WHEN** rule `<rule>` is checked <!-- ruleChecked -->
- **THEN** it is broken in the files the expectation records <!-- brokenAsExpected -->

##### Examples:

  | example                | rule                            |
  | ---------------------- | ------------------------------- |
  | imports-infrastructure | application-imports-only-domain |

### Requirement: no-framework-import · application imports no framework package

An application file SHALL NOT import a framework package: any package, or subpath of one, that the architecture configuration vetoes for the core.

#### Scenario Outline: `<example>` breaks no-framework-import

- **GIVEN** the example `<example>` <!-- exampleFolder -->
- **WHEN** rule `<rule>` is checked <!-- ruleChecked -->
- **THEN** it is broken in the files the expectation records <!-- brokenAsExpected -->

##### Examples:

  | example                   | rule                |
  | ------------------------- | ------------------- |
  | imports-framework-package | no-framework-import |

### Requirement: no-environment · application never touches the environment

An application file SHALL NOT use any global the configured platform provides: the application never touches the environment.

#### Scenario Outline: `<example>` breaks no-environment

- **GIVEN** the example `<example>` <!-- exampleFolder -->
- **WHEN** rule `<rule>` is checked <!-- ruleChecked -->
- **THEN** it is broken in the files the expectation records <!-- brokenAsExpected -->

##### Examples:

  | example           | rule           |
  | ----------------- | -------------- |
  | calls-environment | no-environment |

### Requirement: repository-method-naming · application repository methods say verb plus noun

Every method of an `XRepositoryInterface` SHALL be named `<verb><Noun>` with a verb other than `fetch`; a method whose verb is `get` SHALL NOT declare `null` or `undefined` in its return type, and a method whose verb is `find` SHALL declare one of them. The verb vocabulary is open.

#### Scenario Outline: `<example>` breaks repository-method-naming

- **GIVEN** the example `<example>` <!-- exampleFolder -->
- **WHEN** rule `<rule>` is checked <!-- ruleChecked -->
- **THEN** it is broken in the files the expectation records <!-- brokenAsExpected -->

##### Examples:

  | example          | rule                     |
  | ---------------- | ------------------------ |
  | fetch-verb       | repository-method-naming |
  | bare-verb        | repository-method-naming |
  | get-returns-null | repository-method-naming |
  | find-never-null  | repository-method-naming |

### Requirement: use-case-depends-on-contracts · application use cases depend only on repository interfaces and use cases

Every constructor parameter of an `XUseCase` SHALL be typed by an `XRepositoryInterface` or another `XUseCase`: a use case composes contracts and other use cases, never an adapter, an implementation or a platform object.

#### Scenario Outline: `<example>` breaks use-case-depends-on-contracts

- **GIVEN** the example `<example>` <!-- exampleFolder -->
- **WHEN** rule `<rule>` is checked <!-- ruleChecked -->
- **THEN** it is broken in the files the expectation records <!-- brokenAsExpected -->

##### Examples:

  | example                   | rule                          |
  | ------------------------- | ----------------------------- |
  | depends-on-implementation | use-case-depends-on-contracts |
  | depends-on-adapter        | use-case-depends-on-contracts |

### Requirement: A reference module satisfies the whole layer

The reference module of the workstream that owns this layer, assembled from the `## reference` sections of its example files and of the workstreams it depends on, SHALL break no rule of that workstream.

#### Scenario: `reference` breaks no rule

- **GIVEN** the example `reference` <!-- referenceFolder -->
- **WHEN** every rule of the workstream is checked <!-- workstreamChecked -->
- **THEN** no file breaks any rule <!-- noBrokenFiles -->
