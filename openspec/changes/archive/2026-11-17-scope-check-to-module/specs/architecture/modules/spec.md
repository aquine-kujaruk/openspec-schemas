## ADDED Requirements

### Requirement: A module check reports findings on the selected module

`@by:person`

A check scoped to a module SHALL report its architecture findings on the code and tests of that module, including any cycle it participates in. Whole-product checks and freshness of generated files SHALL still run when the check is unscoped.

#### Scenario Outline: the check for `<scope>` reports `<outcome>`

- **GIVEN** a line where a different module imports from shared and breaks a rule <!-- anotherModuleHasFinding -->
- **AND** the line has an unused file <!-- lineHasUnusedFile -->
- **WHEN** the check for `<scope>` runs <!-- moduleScopeChecked -->
- **THEN** the check reports `<outcome>` <!-- moduleScopeOutcome -->

##### Examples:

  | scope      | outcome                                |
  | shared     | neither the rule violation nor the unused file |
  | production | only the rule violation                |
  | whole line | the rule violation and the unused file |
