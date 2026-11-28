## ADDED Requirements

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
