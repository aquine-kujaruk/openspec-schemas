## MODIFIED Requirements

### Requirement: entity-validates-with-schema · domain entities, aggregates and value objects validate with their schema

`@by:person`

Every file in `entities`, `aggregates` or `value-objects` SHALL import its schema from `../schemas/<name>.schema` with or without a source extension and validate its props in the constructor with `validateSchema(this, XSchema, props)` from `shared/domain/schemas`: one validation path, one common validation exception that names the object and carries the schema error.

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
