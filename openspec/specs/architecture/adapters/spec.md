# Build the adapters layer

## Purpose

Resource adapters, in `infrastructure/adapters`. An adapter talks to one backend of a resource (network, storage, a third-party service) and is the only place where the environment lives. Every adapter of a resource implements that resource's anti-corruption layer (ACL, `acl/x.acl.ts`: `interface XAcl` plus the schemas of its payloads), and `adapters/x.adapter.ts` picks the backend by environment and exports one ACL-typed instance (`export const xAdapter: XAcl`). `shared/infrastructure/adapters` holds the base adapters every module composes. A repository implementation never sees an adapter: it receives one typed by the ACL. So adapters are built and checked apart from repositories, with the ACL as their seam.

It receives from infrastructure the ACLs it implements, fixed before it starts, and from domain the exceptions it throws. It delivers to the entry, which composes, one ACL-typed adapter instance per resource.

Every rule is verified against the cases in `schemas/<schema>/workstreams/<workstream>/<layer>.examples.md`: under each rule, one case per way of breaking it, and a `reference` section. What the tools report on each case, file by file with the tools that reported it, is recorded in the case's `expect` block by `factory expect`, and every case is compared with that record. A case prefixed `todo.` is a known gap that the rule does not catch yet. The reference sections of the workstream and of the workstreams it depends on together form a correct module that breaks no rule of that workstream.

## Requirements

### Requirement: infrastructure-vocabulary · adapter files are named by their suffix

Every file in `infrastructure/adapters` SHALL be named `*.adapter.ts`.

#### Scenario Outline: `<example>` breaks infrastructure-vocabulary

- **GIVEN** the example `<example>` <!-- exampleFolder -->
- **WHEN** rule `<rule>` is checked <!-- ruleChecked -->
- **THEN** it is broken in the files the expectation records <!-- brokenAsExpected -->

##### Examples:

  | example      | rule                      |
  | ------------ | ------------------------- |
  | wrong-suffix | infrastructure-vocabulary |

### Requirement: acl-adapter-paired · adapters implement every anti-corruption layer

Every file `infrastructure/acl/<name>.acl.ts` SHALL export `interface <Name>Acl`, and at least one file of the same module's `infrastructure/adapters` whose name ends with `<name>.adapter.ts` SHALL implement it: the ACL states the methods the system needs from a resource, in the system's own types, and each backend of that resource is an adapter behind it.

#### Scenario Outline: `<example>` breaks acl-adapter-paired

- **GIVEN** the example `<example>` <!-- exampleFolder -->
- **WHEN** rule `<rule>` is checked <!-- ruleChecked -->
- **THEN** it is broken in the files the expectation records <!-- brokenAsExpected -->

##### Examples:

  | example             | rule               |
  | ------------------- | ------------------ |
  | acl-without-adapter | acl-adapter-paired |
  | acl-exports-class   | acl-adapter-paired |

### Requirement: adapter-implements-acl · resource adapters implement an anti-corruption layer

Every class exported by a file in a module's `infrastructure/adapters` SHALL declare `implements <Name>Acl` for an ACL of the same module, except in `shared`, whose adapters are the bases the resource adapters compose.

#### Scenario Outline: `<example>` breaks adapter-implements-acl

- **GIVEN** the example `<example>` <!-- exampleFolder -->
- **WHEN** rule `<rule>` is checked <!-- ruleChecked -->
- **THEN** it is broken in the files the expectation records <!-- brokenAsExpected -->

##### Examples:

  | example                     | rule                   |
  | --------------------------- | ---------------------- |
  | adapter-without-acl         | adapter-implements-acl |
  | implements-other-module-acl | adapter-implements-acl |

### Requirement: adapter-imports-no-domain-schema · adapters import no domain schema

A file in `infrastructure/adapters` SHALL NOT import a file of `domain/schemas`: the adapter speaks the resource's shape, and the ACL accommodates it to the system's shape, importing the domain schemas when both coincide.

#### Scenario Outline: `<example>` breaks adapter-imports-no-domain-schema

- **GIVEN** the example `<example>` <!-- exampleFolder -->
- **WHEN** rule `<rule>` is checked <!-- ruleChecked -->
- **THEN** it is broken in the files the expectation records <!-- brokenAsExpected -->

##### Examples:

  | example               | rule                             |
  | --------------------- | -------------------------------- |
  | imports-domain-schema | adapter-imports-no-domain-schema |

### Requirement: infrastructure-imports-only-core · adapters import only infrastructure, application and domain

A file in `infrastructure/adapters` SHALL import only infrastructure (its ACLs, the shared base adapters), application and domain files: never the entry.

#### Scenario Outline: `<example>` breaks infrastructure-imports-only-core

- **GIVEN** the example `<example>` <!-- exampleFolder -->
- **WHEN** rule `<rule>` is checked <!-- ruleChecked -->
- **THEN** it is broken in the files the expectation records <!-- brokenAsExpected -->

##### Examples:

  | example           | rule                             |
  | ----------------- | -------------------------------- |
  | imports-entry     | infrastructure-imports-only-core |

### Requirement: no-framework-import · adapters import no framework package

A file in `infrastructure/adapters` SHALL NOT import a framework package the architecture configuration vetoes for infrastructure. That list may be narrower than the core's.

#### Scenario Outline: `<example>` breaks no-framework-import

- **GIVEN** the example `<example>` <!-- exampleFolder -->
- **WHEN** rule `<rule>` is checked <!-- ruleChecked -->
- **THEN** it is broken in the files the expectation records <!-- brokenAsExpected -->

##### Examples:

  | example                   | rule                |
  | ------------------------- | ------------------- |
  | imports-framework-package | no-framework-import |

### Requirement: infrastructure-names-the-role · adapters are named by their role

No exported class and no file in `infrastructure/adapters` SHALL be named with `Service`, `Helper`, `Util`, `Utils`, `Manager` or `Common`.

#### Scenario Outline: `<example>` breaks infrastructure-names-the-role

- **GIVEN** the example `<example>` <!-- exampleFolder -->
- **WHEN** rule `<rule>` is checked <!-- ruleChecked -->
- **THEN** it is broken in the files the expectation records <!-- brokenAsExpected -->

##### Examples:

  | example            | rule                          |
  | ------------------ | ----------------------------- |
  | class-named-helper | infrastructure-names-the-role |
  | file-named-util    | infrastructure-names-the-role |

### Requirement: infrastructure-throws-domain-exceptions · adapters throw only domain exceptions

Every `throw new X(` in `infrastructure/adapters` SHALL construct a class imported from a `domain/exceptions` file of its own module, or `ValidationException` from `shared`, and SHALL pass the caught error as `cause`: the adapter translates the resource's failure into the business failure of its module that the client reads.

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

### Requirement: adapter-wraps-external-system · adapters wrap something outside the code

`@by:person`

An adapter SHALL wrap an external system (a package, a platform module or global, the disk, an API) or hold an in-memory stand-in for one; an adapter that only forwards a function it received SHALL be refused, since another module's operation reaches the consumer through its repository implementation.

#### Scenario Outline: `<example>` breaks adapter-wraps-external-system

- **GIVEN** the example `<example>` <!-- exampleFolder -->
- **WHEN** rule `<rule>` is checked <!-- ruleChecked -->
- **THEN** it is broken in the files the expectation records <!-- brokenAsExpected -->

##### Examples:

  | example                    | rule                          |
  | -------------------------- | ----------------------------- |
  | adapter-forwards-callback  | adapter-wraps-external-system |
