## MODIFIED Requirements

### Requirement: A procedure is exercised only in the environments where that is safe

For each procedure the change's plan carries, the verify phase SHALL execute it in the `local` and `sandbox` environments it is tagged with and record the outcome of its verification step. It SHALL NOT execute a procedure in `prod`; there the evidence SHALL record the procedure as reviewed only. A procedure the person declined while planning, and for which no outcome is given, SHALL be recorded as declined and SHALL NOT make the change not verified; given an outcome, it SHALL be recorded as executed like any other.

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

#### Scenario Outline: a procedure in `<env>` probed `<probed>` with outcome `<outcome>` is recorded as `<treatment>` and the change is `<verdict>`

- **GIVEN** a built change with `<scenarios>` scenario(s) <!-- builtChangeWithScenarios -->
- **AND** its plan carries a procedure in `<env>` probed `<probed>` <!-- planProcedureProbedAs -->
- **AND** the procedure's outcome is `<outcome>` <!-- procedureOutcomeIs -->
- **WHEN** the change is verified <!-- verifyChange -->
- **THEN** the evidence records the procedure in `<env>` as `<treatment>` <!-- evidenceRecordsProcedureAs -->
- **AND** the change is reported `<verdict>` <!-- changeReportedAs -->

##### Examples:

  | scenarios | env     | probed     | outcome | treatment    | verdict      |
  | --------- | ------- | ---------- | ------- | ------------ | ------------ |
  | 0         | sandbox | declined   | none    | declined     | verified     |
  | 0         | sandbox | declined   | passed  | executed     | verified     |
  | 0         | sandbox | 2026-11-16 | none    | not executed | not verified |
