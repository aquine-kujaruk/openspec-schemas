## ADDED Requirements

### Requirement: A change is judged by the checks of its own schema

The gate SHALL judge a change in implementation by the checks of the workstreams its own schema has. A change whose schema has no workstreams SHALL be held only by an altered harness.

#### Scenario Outline: a `<schema>` change finishing while the product's checks `<checks>` is `<verdict>`

- **GIVEN** a change in implementation made with the schema `<schema>` <!-- changeInImplementationWithSchema -->
- **AND** the checks of the product's workstreams `<checks>` <!-- productChecks -->
- **WHEN** the `<agentKind>` agent is about to finish <!-- aboutToFinish -->
- **THEN** finishing is `<verdict>` <!-- finishVerdict -->

##### Examples:

  | schema        | checks | agentKind | verdict |
  | ------------- | ------ | --------- | ------- |
  | clean-backend | fail   | main      | refused |
  | spec-plan     | fail   | main      | allowed |
  | spec-plan     | pass   | main      | allowed |
