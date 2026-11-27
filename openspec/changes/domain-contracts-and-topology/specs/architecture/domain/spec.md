## Purpose

Entity, aggregate, value object, schema, exception and service. The domain is the business knowledge: rules, validation and the canonical representation of the concepts. It imports nothing from outside itself or the domain of `shared`. An aggregate is optional and born by need: it exists when several entities and value objects form a higher-order concept, never by obligation. A service is a stateless rule that crosses entities, named by the policy it implements, and the last resort after an instance method and a static one.

It receives the business problem (which concepts exist and which rules they obey) and, from `shared/domain`, the common value objects with their schemas, the validation helper (`validateSchema`) and the exception base (`DomainException`). It delivers to application the entities, aggregates and value objects with their methods, the schemas (`XSchema`, `XProps` and the enums of its closed sets), the services and the business exceptions (`XException`, each extending `DomainException` and carrying its cause); the outer layers read those same types and never mutate them.

Every rule is verified against the cases in `schemas/<schema>/workstreams/<workstream>/<layer>.examples.md`: under each rule, one case per way of breaking it, and a `reference` section. What the tools report on each case, file by file with the tools that reported it, is recorded in the case's `expect` block by `factory expect`, and every case is compared with that record. A case prefixed `todo.` is a known gap that the rule does not catch yet. The reference sections of the workstream and of the workstreams it depends on together form a correct module that breaks no rule of that workstream.

## ADDED Requirements

### Requirement: class-name-carries-role · domain classes carry their role in their exported name

`@by:person`

Every class exported from a file in `entities`, `aggregates` or `value-objects` SHALL end in the role its folder names: `XEntity`, `XAggregate`, `XValueObject`. The file name and the class name say the same thing, so a reader never has to open the file to know what the class is.

#### Scenario Outline: `<example>` breaks class-name-carries-role

- **GIVEN** the example `<example>` <!-- exampleFolder -->
- **WHEN** rule `<rule>` is checked <!-- ruleChecked -->
- **THEN** it is broken in the files the expectation records <!-- brokenAsExpected -->

##### Examples:

  | example                   | rule                    |
  | ------------------------- | ----------------------- |
  | entity-without-role       | class-name-carries-role |
  | aggregate-without-role    | class-name-carries-role |
  | value-object-without-role | class-name-carries-role |

### Requirement: schema-validates-at-runtime · domain schemas export a runtime schema

`@by:person`

Every file in `schemas` SHALL export at least one runtime schema, a constant named `XSchema`, and infer its types from it where the shapes match; a type that describes a function may stay hand-written next to it. The shared validation helper that exports `validateSchema` is exempt. A file of TypeScript types alone validates nothing, though its name says it does.

#### Scenario Outline: `<example>` breaks schema-validates-at-runtime

- **GIVEN** the example `<example>` <!-- exampleFolder -->
- **WHEN** rule `<rule>` is checked <!-- ruleChecked -->
- **THEN** it is broken in the files the expectation records <!-- brokenAsExpected -->

##### Examples:

  | example          | rule                        |
  | ---------------- | --------------------------- |
  | type-only-schema | schema-validates-at-runtime |
  | interface-schema | schema-validates-at-runtime |

### Requirement: value-object-holds-several-values · value objects hold a coherent set of values

`@by:person`

The schema a value object validates with SHALL be a `z.object` with two or more keys. A value of one field is a validated field of its owner's schema, not a class that wraps it.

#### Scenario Outline: `<example>` breaks value-object-holds-several-values

- **GIVEN** the example `<example>` <!-- exampleFolder -->
- **WHEN** rule `<rule>` is checked <!-- ruleChecked -->
- **THEN** it is broken in the files the expectation records <!-- brokenAsExpected -->

##### Examples:

  | example              | rule                              |
  | -------------------- | --------------------------------- |
  | single-value-wrapper | value-object-holds-several-values |
