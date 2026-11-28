## ADDED Requirements

### Requirement: repository-returns-records · infrastructure repositories return records, not domain objects

`@by:person`

A repository implementation SHALL return the records its anti-corruption layer validated and SHALL NOT construct or import an entity, aggregate or value object; the use case hydrates them through the domain.

#### Scenario Outline: `<example>` breaks repository-returns-records

- **GIVEN** the example `<example>` <!-- exampleFolder -->
- **WHEN** rule `<rule>` is checked <!-- ruleChecked -->
- **THEN** it is broken in the files the expectation records <!-- brokenAsExpected -->

##### Examples:

  | example                   | rule                       |
  | ------------------------- | -------------------------- |
  | repository-builds-entity  | repository-returns-records |
  | repository-imports-entity | repository-returns-records |
