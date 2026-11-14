# Build the domain layer

## Purpose

Entity, aggregate, value object, schema, exception and service. The domain is the business knowledge: rules, validation and the canonical representation of the concepts. It imports nothing from outside itself or the domain of `shared`. An aggregate is optional and born by need: it exists when several entities and value objects form a higher-order concept, never by obligation. A service is a stateless rule that crosses entities, named by the policy it implements, and the last resort after an instance method and a static one.

It receives the business problem (which concepts exist and which rules they obey) and, from `shared/domain`, the common value objects with their schemas, the validation helper (`validateSchema`) and the exception base (`DomainException`). It delivers to application the entities, aggregates and value objects with their methods, the schemas (`XSchema`, `XProps` and the enums of its closed sets), the services and the business exceptions (`XException`, each extending `DomainException` and carrying its cause); the outer layers read those same types and never mutate them.

Every rule is verified against the cases in `schemas/<schema>/workstreams/<workstream>/<layer>.examples.md`: under each rule, one case per way of breaking it, and a `reference` section. What the tools report on each case, file by file with the tools that reported it, is recorded in the case's `expect` block by `factory expect`, and every case is compared with that record. A case prefixed `todo.` is a known gap that the rule does not catch yet. The reference sections of the workstream and of the workstreams it depends on together form a correct module that breaks no rule of that workstream.

## Requirements

### Requirement: domain-vocabulary · domain is a closed vocabulary

The domain SHALL contain only the folders `entities`, `aggregates`, `value-objects`, `schemas`, `exceptions` and `services`, and every file in them SHALL carry its folder's suffix: `.entity.ts`, `.aggregate.ts`, `.value-object.ts`, `.schema.ts`, `.exceptions.ts`, `.service.ts`.

#### Scenario Outline: `<example>` breaks domain-vocabulary

- **GIVEN** the example `<example>` <!-- exampleFolder -->
- **WHEN** rule `<rule>` is checked <!-- ruleChecked -->
- **THEN** it is broken in the files the expectation records <!-- brokenAsExpected -->

##### Examples:

  | example                   | rule              |
  | ------------------------- | ----------------- |
  | folder-outside-vocabulary | domain-vocabulary |
  | wrong-suffix              | domain-vocabulary |
  | rules-folder              | domain-vocabulary |

### Requirement: entity-validates-with-schema · domain entities, aggregates and value objects validate with their schema

Every file in `entities`, `aggregates` or `value-objects` SHALL import its schema from `../schemas/<name>.schema` and validate its props in the constructor with `validateSchema(this, XSchema, props)` from `shared/domain/schemas`: one validation path, one common validation exception that names the object and carries the schema error.

#### Scenario Outline: `<example>` breaks entity-validates-with-schema

- **GIVEN** the example `<example>` <!-- exampleFolder -->
- **WHEN** rule `<rule>` is checked <!-- ruleChecked -->
- **THEN** it is broken in the files the expectation records <!-- brokenAsExpected -->

##### Examples:

  | example             | rule                         |
  | ------------------- | ---------------------------- |
  | no-schema           | entity-validates-with-schema |
  | parses-directly     | entity-validates-with-schema |
  | validates-elsewhere | entity-validates-with-schema |

### Requirement: domain-imports-only-domain · domain imports no other layer

A domain file SHALL import only domain files: never application, infrastructure or the entry.

#### Scenario Outline: `<example>` breaks domain-imports-only-domain

- **GIVEN** the example `<example>` <!-- exampleFolder -->
- **WHEN** rule `<rule>` is checked <!-- ruleChecked -->
- **THEN** it is broken in the files the expectation records <!-- brokenAsExpected -->

##### Examples:

  | example                | rule                       |
  | ---------------------- | -------------------------- |
  | imports-infrastructure | domain-imports-only-domain |

### Requirement: no-framework-import · domain imports no framework package

A domain file SHALL NOT import a framework package: any package, or subpath of one, that the architecture configuration vetoes for the core.

#### Scenario Outline: `<example>` breaks no-framework-import

- **GIVEN** the example `<example>` <!-- exampleFolder -->
- **WHEN** rule `<rule>` is checked <!-- ruleChecked -->
- **THEN** it is broken in the files the expectation records <!-- brokenAsExpected -->

##### Examples:

  | example                   | rule                |
  | ------------------------- | ------------------- |
  | imports-framework-package | no-framework-import |

### Requirement: no-environment · domain never touches the environment

A domain file SHALL NOT use any global the configured platform provides: the domain never touches the environment.

#### Scenario Outline: `<example>` breaks no-environment

- **GIVEN** the example `<example>` <!-- exampleFolder -->
- **WHEN** rule `<rule>` is checked <!-- ruleChecked -->
- **THEN** it is broken in the files the expectation records <!-- brokenAsExpected -->

##### Examples:

  | example           | rule           |
  | ----------------- | -------------- |
  | calls-environment | no-environment |

### Requirement: aggregate-composes-domain-objects · domain aggregates compose entities or value objects

Every file in `aggregates` SHALL import at least one entity or value object of its module or of `shared` and hold it as a property: an aggregate is a higher-order object born by need, never a renamed entity.

#### Scenario Outline: `<example>` breaks aggregate-composes-domain-objects

- **GIVEN** the example `<example>` <!-- exampleFolder -->
- **WHEN** rule `<rule>` is checked <!-- ruleChecked -->
- **THEN** it is broken in the files the expectation records <!-- brokenAsExpected -->

##### Examples:

  | example                | rule                              |
  | ---------------------- | --------------------------------- |
  | composes-nothing       | aggregate-composes-domain-objects |
  | imports-but-holds-none | aggregate-composes-domain-objects |

### Requirement: exception-extends-domain-exception · domain exceptions extend the common base

In every module, exactly one class across `domain/exceptions/*.exceptions.ts` SHALL extend `DomainException` from `shared/domain/exceptions`: the module's base. Every other class in those files SHALL reach the base through `extends`. Only `shared` declares `DomainException` itself. The exceptions of a module are its contract with the domain's client: one per business failure, the technical error in `cause`.

#### Scenario Outline: `<example>` breaks exception-extends-domain-exception

- **GIVEN** the example `<example>` <!-- exampleFolder -->
- **WHEN** rule `<rule>` is checked <!-- ruleChecked -->
- **THEN** it is broken in the files the expectation records <!-- brokenAsExpected -->

##### Examples:

  | example          | rule                               |
  | ---------------- | ---------------------------------- |
  | extends-error    | exception-extends-domain-exception |
  | extends-nothing  | exception-extends-domain-exception |
  | redeclares-base  | exception-extends-domain-exception |
  | two-module-bases | exception-extends-domain-exception |

### Requirement: closed-set-lives-in-schema · domain closed sets are enums declared in schemas

Every `enum` of the core (domain, application, infrastructure) SHALL be declared in `domain/schemas`, next to the schema that validates it with the schema package's enum form; a set over an enum (the dead statuses, the terminable types) lives beside the enum. An external contract's enum MAY live in `infrastructure/acl`.

#### Scenario Outline: `<example>` breaks closed-set-lives-in-schema

- **GIVEN** the example `<example>` <!-- exampleFolder -->
- **WHEN** rule `<rule>` is checked <!-- ruleChecked -->
- **THEN** it is broken in the files the expectation records <!-- brokenAsExpected -->

##### Examples:

  | example            | rule                       |
  | ------------------ | -------------------------- |
  | enum-in-entity     | closed-set-lives-in-schema |
  | enum-in-use-case   | closed-set-lives-in-schema |
  | enum-in-repository | closed-set-lives-in-schema |

### Requirement: no-magic-closed-set-strings · domain compares closed sets through their enum

No core file SHALL compare a property named `status`, `type`, `kind`, `mode`, `state` or `code` with a string literal, nor switch over it with literal cases: the comparison names the enum member, so every branch is checkable.

#### Scenario Outline: `<example>` breaks no-magic-closed-set-strings

- **GIVEN** the example `<example>` <!-- exampleFolder -->
- **WHEN** rule `<rule>` is checked <!-- ruleChecked -->
- **THEN** it is broken in the files the expectation records <!-- brokenAsExpected -->

##### Examples:

  | example                  | rule                        |
  | ------------------------ | --------------------------- |
  | compares-status-literal  | no-magic-closed-set-strings |
  | switches-on-type-literal | no-magic-closed-set-strings |

### Requirement: domain-service-named-by-policy · domain services are named by the policy they implement

Every file in `services` SHALL export one class named `XService` where `X` names a business policy, never `Helper`, `Util`, `Manager`, `Common`, `Rules` or `Filters`: a domain service is a stateless rule that crosses entities, not a drawer of functions.

#### Scenario Outline: `<example>` breaks domain-service-named-by-policy

- **GIVEN** the example `<example>` <!-- exampleFolder -->
- **WHEN** rule `<rule>` is checked <!-- ruleChecked -->
- **THEN** it is broken in the files the expectation records <!-- brokenAsExpected -->

##### Examples:

  | example          | rule                           |
  | ---------------- | ------------------------------ |
  | named-helper     | domain-service-named-by-policy |
  | exports-no-class | domain-service-named-by-policy |

### Requirement: A reference module satisfies the whole layer

The reference module of the workstream that owns this layer, assembled from the `## reference` sections of its example files and of the workstreams it depends on, SHALL break no rule of that workstream.

#### Scenario: `reference` breaks no rule

- **GIVEN** the example `reference` <!-- referenceFolder -->
- **WHEN** every rule of the workstream is checked <!-- workstreamChecked -->
- **THEN** no file breaks any rule <!-- noBrokenFiles -->
