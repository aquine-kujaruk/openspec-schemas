## Purpose

Verifying a change: the checks and tests the schema's validator names are run on what was built, every scenario of the change is matched to what proves it, and the result is written as evidence. Verifying judges and records; it never fixes.

## ADDED Requirements

### Requirement: Evidence matches every scenario to what proves it

The verify phase SHALL write evidence that matches each scenario of the change to the test that proves it, and SHALL report the change as verified only when every scenario is matched to a passing test and every check passes. A change with no scenario SHALL be verified on its checks alone.

#### Scenario Outline: `<passing>` of `<scenarios>` scenario(s) passing makes the change `<verdict>`

- **GIVEN** a built change with `<scenarios>` scenario(s) <!-- builtChangeWithScenarios -->
- **AND** `<passing>` of them pass their acceptance test <!-- scenariosPassing -->
- **AND** every check of its workstreams passes <!-- everyCheckPasses -->
- **WHEN** the change is verified <!-- verifyChange -->
- **THEN** the evidence matches `<passing>` scenario(s) to a passing test <!-- evidenceMatchesScenarios -->
- **AND** the change is reported `<verdict>` <!-- changeReportedAs -->

##### Examples:

  | scenarios | passing | verdict      |
  | --------- | ------- | ------------ |
  | 3         | 3       | verified     |
  | 3         | 2       | not verified |
  | 0         | 0       | verified     |

### Requirement: A failing check is feedback, never a fix

When a check or a test fails, the verify phase SHALL raise feedback naming the workstream it belongs to and SHALL change no file of the product.

#### Scenario Outline: `<workstream>` failing its check raises feedback and changes `<changedFiles>` product file(s)

- **GIVEN** a built change with `<scenarios>` scenario(s) <!-- builtChangeWithScenarios -->
- **AND** the workstream `<workstream>` fails its check <!-- workstreamFailsCheck -->
- **WHEN** the change is verified <!-- verifyChange -->
- **THEN** feedback is raised naming the workstream `<workstream>` <!-- feedbackNamesWorkstream -->
- **AND** the change is reported `<verdict>` <!-- changeReportedAs -->
- **AND** `<changedFiles>` file(s) of the product changed <!-- productFilesChanged -->

##### Examples:

  | scenarios | workstream     | verdict      | changedFiles |
  | --------- | -------------- | ------------ | ------------ |
  | 3         | infrastructure | not verified | 0            |
  | 3         | integrate      | not verified | 0            |

### Requirement: The rubric review runs only where its key is configured

The verify phase SHALL run the rubric review when the project configures the review's key, and SHALL skip it otherwise. The evidence SHALL say which happened. Whether the review ran SHALL NOT change the verdict.

#### Scenario Outline: with the review key `<key>` the review is `<review>` and the change is `<verdict>`

- **GIVEN** a built change with `<scenarios>` scenario(s) <!-- builtChangeWithScenarios -->
- **AND** `<passing>` of them pass their acceptance test <!-- scenariosPassing -->
- **AND** every check of its workstreams passes <!-- everyCheckPasses -->
- **AND** the project's review key is `<key>` <!-- reviewKeyIs -->
- **WHEN** the change is verified <!-- verifyChange -->
- **THEN** the evidence records the review as `<review>` <!-- evidenceRecordsReviewAs -->
- **AND** the change is reported `<verdict>` <!-- changeReportedAs -->

##### Examples:

  | scenarios | passing | key        | review  | verdict  |
  | --------- | ------- | ---------- | ------- | -------- |
  | 3         | 3       | configured | run     | verified |
  | 3         | 3       | absent     | skipped | verified |

### Requirement: A review warning is recorded and fails nothing

Each warning the rubric review raises SHALL be listed in the evidence with its row and its certainty. A warning SHALL NOT make the change not verified.

#### Scenario Outline: `<warnings>` review warning(s) leave the change `<verdict>`

- **GIVEN** a built change with `<scenarios>` scenario(s) <!-- builtChangeWithScenarios -->
- **AND** `<passing>` of them pass their acceptance test <!-- scenariosPassing -->
- **AND** every check of its workstreams passes <!-- everyCheckPasses -->
- **AND** the project's review key is `<key>` <!-- reviewKeyIs -->
- **AND** the review raises `<warnings>` warning(s) <!-- reviewRaisesWarnings -->
- **WHEN** the change is verified <!-- verifyChange -->
- **THEN** the evidence lists `<warnings>` review warning(s) <!-- evidenceListsWarnings -->
- **AND** the change is reported `<verdict>` <!-- changeReportedAs -->

##### Examples:

  | scenarios | passing | key        | warnings | verdict  |
  | --------- | ------- | ---------- | -------- | -------- |
  | 3         | 3       | configured | 2        | verified |
  | 3         | 3       | configured | 0        | verified |

### Requirement: A procedure is exercised only in the environments where that is safe

For each procedure the change's plan carries, the verify phase SHALL execute it in the `local` and `sandbox` environments it is tagged with and record the outcome of its verification step. It SHALL NOT execute a procedure in `prod`; there the evidence SHALL record the procedure as reviewed only.

#### Scenario Outline: a procedure tagged for `<env>` is recorded as `<treatment>`

- **GIVEN** a built change with `<scenarios>` scenario(s) <!-- builtChangeWithScenarios -->
- **AND** its plan carries a procedure tagged for the environment `<env>` <!-- planProcedureTaggedFor -->
- **WHEN** the change is verified <!-- verifyChange -->
- **THEN** the evidence records the procedure in `<env>` as `<treatment>` <!-- evidenceRecordsProcedureAs -->

##### Examples:

  | scenarios | env     | treatment     |
  | --------- | ------- | ------------- |
  | 0         | local   | executed      |
  | 0         | sandbox | executed      |
  | 0         | prod    | reviewed only |
