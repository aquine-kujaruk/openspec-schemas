## ADDED Requirements

### Requirement: review-asks-core-and-schema-rows · review asks the rows of the core and the rows of the schema

`factory review` SHALL ask the rubric rows of the product's schema: the rows of the core the schema names, then the rows the schema adds. A schema that adds no row SHALL be asked the core's rows alone, and a row id SHALL belong to one rubric only.

#### Scenario Outline: a product of `<schema>` is asked the rows `<asked>`

- **GIVEN** a core whose rubric has the rows `<coreRows>` <!-- coreRubricRows -->
- **AND** the schema `<schema>` names that core and adds the rows `<schemaRows>` <!-- schemaAddsRows -->
- **WHEN** `factory review` runs over a product of `<schema>` <!-- reviewRunsOverProductOf -->
- **THEN** the rows asked are `<asked>` <!-- rowsAsked -->

##### Examples:

  | coreRows | schema        | schemaRows | asked              |
  | -------- | ------------- | ---------- | ------------------ |
  | S05, S06 | clean-backend | none       | S05, S06           |
  | S05, S06 | clean-react   | S01, S02   | S05, S06, S01, S02 |
