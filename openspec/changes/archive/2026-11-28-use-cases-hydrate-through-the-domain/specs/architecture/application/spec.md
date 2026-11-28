## ADDED Requirements

### Requirement: required-part-throws-in-domain · a missing required part fails in the domain

`@by:person`

When a use case needs a part of an aggregate that is missing, the domain SHALL throw its exception through a required lookup, and the use case SHALL NOT throw for it; an optional lookup stays for callers that accept absence.

#### Scenario Outline: `<example>` breaks required-part-throws-in-domain

- **GIVEN** the example `<example>` <!-- exampleFolder -->
- **WHEN** rule `<rule>` is checked <!-- ruleChecked -->
- **THEN** it is broken in the files the expectation records <!-- brokenAsExpected -->

##### Examples:

  | example                    | rule                           |
  | -------------------------- | ------------------------------ |
  | use-case-throws-on-missing | required-part-throws-in-domain |
