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

## ADDED Requirements

### Requirement: Repository suites prove each changed scenario by name

`@by:person`

For a repository capability with no generated adapter, verify SHALL execute its checked-in `test/schemas/<spec>.test.ts` when present. It SHALL match every concrete scenario of an added or modified requirement against a passing Vitest assertion with the same requirement and title. It SHALL identify each missing or failing scenario in the evidence and leave the change unverified. A passing test under another requirement SHALL NOT substitute for a missing scenario.

#### Scenario Outline: Repository assertion <assertion> produces <proof>

- **GIVEN** a repository suite with a named scenario and an assertion that is `<assertion>` <!-- namedSuiteAssertion -->
- **WHEN** the change is verified <!-- verifyChange -->
- **THEN** the evidence for the named scenario is `<proof>` <!-- namedScenarioProof -->
- **AND** the change is reported `<verdict>` <!-- changeReportedAs -->

##### Examples:

  | assertion | proof | verdict |
  | --- | --- | --- |
  | passing | passed | verified |
  | failed | failed | not verified |
  | skipped | failed | not verified |
  | absent | missing | not verified |
  | other requirement | missing | not verified |
  | other title | missing | not verified |
