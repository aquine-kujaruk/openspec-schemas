# Build the infrastructure layer

## Purpose

Anti-corruption layer (ACL) and repository implementation. Infrastructure implements the application interfaces against the real world (network, storage, clock, third-party services). A resource adapter talks to one backend of a resource and is the only place where the environment lives; adapters are a layer of their own (`openspec/specs/architecture/adapters`), built apart, and this layer's rules stop at `infrastructure/adapters`. The ACL (`acl/x.acl.ts`: `interface XAcl` plus the schemas of its payloads) states what the system needs from that resource, in the system's own types, and every adapter of the resource implements it; the repository implementation (`repository-implementations/x.repository-implementation.ts`: `XRepositoryImplementation`, one per interface) receives its adapters typed by their ACL and never constructs one. A session or storage reader is a repository. It imports application and domain.

It receives from application `XRepositoryInterface` (the exact signature of each method) and from domain the `XProps` it must return and the exceptions it throws. It delivers to the adapters layer the ACLs they implement, and to the entry, which composes, `XRepositoryImplementation`, built against the ACL so the adapter can be faked; it exports no repository instance.

Every rule is verified against the cases in `schemas/<schema>/workstreams/<workstream>/<layer>.examples.md`: under each rule, one case per way of breaking it, and a `reference` section. What the tools report on each case, file by file with the tools that reported it, is recorded in the case's `expect` block by `factory expect`, and every case is compared with that record. A case prefixed `todo.` is a known gap that the rule does not catch yet. The reference sections of the workstream and of the workstreams it depends on together form a correct module that breaks no rule of that workstream.

## Requirements

### Requirement: infrastructure-vocabulary · infrastructure folders form a closed vocabulary

Infrastructure SHALL contain only the folders `adapters`, `acl` and `repository-implementations`, plus the emergent folders the architecture configuration declares. Files in `acl` SHALL be named `*.acl.ts`, files in `repository-implementations` `*.repository-implementation.ts`, and files in an emergent folder with the suffix it declares; the adapters layer names the files of `adapters`.

#### Scenario Outline: `<example>` breaks infrastructure-vocabulary

- **GIVEN** the example `<example>` <!-- exampleFolder -->
- **WHEN** rule `<rule>` is checked <!-- ruleChecked -->
- **THEN** it is broken in the files the expectation records <!-- brokenAsExpected -->

##### Examples:

  | example                   | rule                      |
  | ------------------------- | ------------------------- |
  | folder-outside-vocabulary | infrastructure-vocabulary |
  | wrong-suffix              | infrastructure-vocabulary |
  | emergent-wrong-suffix     | infrastructure-vocabulary |

### Requirement: repository-implements-interface · infrastructure repositories implement their interface

Every class in `infrastructure/repository-implementations`, abstract or concrete, SHALL reach a repository interface `XRepositoryInterface`: it declares `implements XRepositoryInterface`, or it extends a class of the same module's `infrastructure/repository-implementations` that reaches one. A concrete class is named `XRepositoryImplementation`.

#### Scenario Outline: `<example>` breaks repository-implements-interface

- **GIVEN** the example `<example>` <!-- exampleFolder -->
- **WHEN** rule `<rule>` is checked <!-- ruleChecked -->
- **THEN** it is broken in the files the expectation records <!-- brokenAsExpected -->

##### Examples:

  | example                        | rule                            |
  | ------------------------------ | ------------------------------- |
  | no-implements                  | repository-implements-interface |
  | extends-base-without-interface | repository-implements-interface |
  | named-by-technology            | repository-implements-interface |

### Requirement: infrastructure-imports-only-core · infrastructure imports only application and domain

A file in infrastructure outside `adapters` SHALL import only infrastructure files outside `adapters`, application and domain files: never the adapters or the entry. The adapter is injected through its ACL.

#### Scenario Outline: `<example>` breaks infrastructure-imports-only-core

- **GIVEN** the example `<example>` <!-- exampleFolder -->
- **WHEN** rule `<rule>` is checked <!-- ruleChecked -->
- **THEN** it is broken in the files the expectation records <!-- brokenAsExpected -->

##### Examples:

  | example           | rule                             |
  | ----------------- | -------------------------------- |
  | imports-entry     | infrastructure-imports-only-core |
  | imports-adapter   | infrastructure-imports-only-core |

### Requirement: no-framework-import · infrastructure files import no framework package

A file in infrastructure outside `adapters` SHALL NOT import a framework package the architecture configuration vetoes for infrastructure. That list may be narrower than the core's.

#### Scenario Outline: `<example>` breaks no-framework-import

- **GIVEN** the example `<example>` <!-- exampleFolder -->
- **WHEN** rule `<rule>` is checked <!-- ruleChecked -->
- **THEN** it is broken in the files the expectation records <!-- brokenAsExpected -->

##### Examples:

  | example                   | rule                |
  | ------------------------- | ------------------- |
  | imports-framework-package | no-framework-import |

### Requirement: only-adapters-touch-environment · infrastructure adapters alone talk to the environment

A file in `infrastructure/repository-implementations` or `infrastructure/acl` SHALL NOT use any global the configured platform provides: a repository composes adapters through their ACL, and the adapter is where the environment lives.

#### Scenario Outline: `<example>` breaks only-adapters-touch-environment

- **GIVEN** the example `<example>` <!-- exampleFolder -->
- **WHEN** rule `<rule>` is checked <!-- ruleChecked -->
- **THEN** it is broken in the files the expectation records <!-- brokenAsExpected -->

##### Examples:

  | example              | rule                            |
  | -------------------- | ------------------------------- |
  | uses-platform-global | only-adapters-touch-environment |

### Requirement: repository-depends-on-acl · infrastructure repositories receive their adapters typed by the anti-corruption layer

`@by:person`

Every constructor parameter of a class in `infrastructure/repository-implementations` SHALL be typed by an `<Name>Acl` interface, and the file SHALL import nothing from `infrastructure/adapters`: a repository is a pure function of its ACLs, so a test replaces them with fakes.

#### Scenario Outline: `<example>` breaks repository-depends-on-acl

- **GIVEN** the example `<example>` <!-- exampleFolder -->
- **WHEN** rule `<rule>` is checked <!-- ruleChecked -->
- **THEN** it is broken in the files the expectation records <!-- brokenAsExpected -->

##### Examples:

  | example                | rule                      |
  | ---------------------- | ------------------------- |
  | typed-by-adapter-class | repository-depends-on-acl |
  | imports-adapter-file   | repository-depends-on-acl |
  | imports-adapter-with-extension | repository-depends-on-acl |

### Requirement: repository-never-news-adapter · infrastructure repositories construct no adapter

No file in `infrastructure/repository-implementations` SHALL contain `new <Name>Adapter(`, in a constructor default or anywhere else: the adapter is injected, and the composition root is the entry.

#### Scenario Outline: `<example>` breaks repository-never-news-adapter

- **GIVEN** the example `<example>` <!-- exampleFolder -->
- **WHEN** rule `<rule>` is checked <!-- ruleChecked -->
- **THEN** it is broken in the files the expectation records <!-- brokenAsExpected -->

##### Examples:

  | example                 | rule                          |
  | ----------------------- | ----------------------------- |
  | news-adapter-in-default | repository-never-news-adapter |
  | news-adapter-in-method  | repository-never-news-adapter |

### Requirement: infrastructure-names-the-role · infrastructure names every object by its role

No exported class and no file in infrastructure outside `adapters` SHALL be named with `Service`, `Helper`, `Util`, `Utils`, `Manager` or `Common`: an emergent object says what it does (`Paginator`, `Retrier`) and lives in the folder the configuration declares for its role.

#### Scenario Outline: `<example>` breaks infrastructure-names-the-role

- **GIVEN** the example `<example>` <!-- exampleFolder -->
- **WHEN** rule `<rule>` is checked <!-- ruleChecked -->
- **THEN** it is broken in the files the expectation records <!-- brokenAsExpected -->

##### Examples:

  | example            | rule                          |
  | ------------------ | ----------------------------- |
  | class-named-helper | infrastructure-names-the-role |
  | file-named-util    | infrastructure-names-the-role |

### Requirement: infrastructure-throws-domain-exceptions · infrastructure throws only domain exceptions

Every `throw new X(` in infrastructure outside `adapters` SHALL construct a class imported from a `domain/exceptions` file of its own module, or `ValidationException` from `shared`, and SHALL pass the caught error as `cause`: infrastructure translates the resource's failure into the business failure of its module that the client reads.

#### Scenario Outline: `<example>` breaks infrastructure-throws-domain-exceptions

- **GIVEN** the example `<example>` <!-- exampleFolder -->
- **WHEN** rule `<rule>` is checked <!-- ruleChecked -->
- **THEN** it is broken in the files the expectation records <!-- brokenAsExpected -->

##### Examples:

  | example                    | rule                                    |
  | -------------------------- | --------------------------------------- |
  | throws-raw-error           | infrastructure-throws-domain-exceptions |
  | throws-own-exception-class | infrastructure-throws-domain-exceptions |
  | throws-without-cause       | infrastructure-throws-domain-exceptions |
  | throws-shared-exception    | infrastructure-throws-domain-exceptions |

### Requirement: A reference module satisfies the whole layer

The reference module of the workstream that owns this layer, assembled from the `## reference` sections of its example files and of the workstreams it depends on, SHALL break no rule of that workstream.

#### Scenario: `reference` breaks no rule

- **GIVEN** the example `reference` <!-- referenceFolder -->
- **WHEN** every rule of the workstream is checked <!-- workstreamChecked -->
- **THEN** no file breaks any rule <!-- noBrokenFiles -->
