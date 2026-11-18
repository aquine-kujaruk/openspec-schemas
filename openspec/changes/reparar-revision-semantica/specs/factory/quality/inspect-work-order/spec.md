## MODIFIED Requirements

### Requirement: The rubric review runs only where its key is configured

`@by:person`

The verify phase SHALL run the rubric review when the project configures the review's key, and SHALL skip it otherwise. The evidence SHALL say which happened. A skipped review SHALL NOT change the verdict. When the key is configured and the review reports itself incomplete, the evidence SHALL record it as incomplete with its causes and the change SHALL be reported not verified until a complete review runs.

#### Scenario Outline: with the review key `<key>` the review is `<review>` and the change is `<verdict>`

- **GIVEN** a built change with `<scenarios>` scenario(s) <!-- builtChangeWithScenarios -->
- **AND** `<passing>` of them pass their acceptance test <!-- scenariosPassing -->
- **AND** every check of its workstreams passes <!-- everyCheckPasses -->
- **AND** the project's review key is `<key>` <!-- reviewKeyIs -->
- **AND** the review run is `<run>` <!-- reviewRunIs -->
- **WHEN** the change is verified <!-- verifyChange -->
- **THEN** the evidence records the review as `<review>` <!-- evidenceRecordsReviewAs -->
- **AND** the change is reported `<verdict>` <!-- changeReportedAs -->

##### Examples:

  | scenarios | passing | key        | run        | review     | verdict      |
  | --------- | ------- | ---------- | ---------- | ---------- | ------------ |
  | 3         | 3       | configured | complete   | run        | verified     |
  | 3         | 3       | absent     | not run    | skipped    | verified     |
  | 3         | 3       | configured | incomplete | incomplete | not verified |
