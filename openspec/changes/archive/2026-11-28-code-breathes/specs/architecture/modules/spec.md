## ADDED Requirements

### Requirement: code-breathes · statements are separated by blank lines

`@by:person`

A statement SHALL be separated from the statement before it by a blank line when either of them spans several lines, and a `return` or `throw` that is not alone in its block SHALL always be apart. Single-line declarations and imports MAY stay together.

#### Scenario Outline: `<example>` breaks code-breathes

- **GIVEN** the example `<example>` <!-- exampleFolder -->
- **WHEN** rule `<rule>` is checked <!-- ruleChecked -->
- **THEN** it is broken in the files the expectation records <!-- brokenAsExpected -->

##### Examples:

  | example                | rule          |
  | ---------------------- | ------------- |
  | return-glued           | code-breathes |
  | multiline-glued        | code-breathes |
  | multiline-block-glued  | code-breathes |
