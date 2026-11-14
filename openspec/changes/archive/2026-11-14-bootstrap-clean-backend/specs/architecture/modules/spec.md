## Purpose

Cross-module rules: isolation between modules, cycles, no test living inside the product, and rules that hold for the whole core whatever the layer. This delta adds one whole-core rule; the rest of the capability arrives with the baseline import described in the change's design.

## ADDED Requirements

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
