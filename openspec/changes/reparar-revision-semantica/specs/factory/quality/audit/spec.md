## ADDED Requirements

### Requirement: review-judges-declared-modules · review judges the modules the product declares

`@by:person`

`factory review` SHALL select the core files under the modules the product's configuration declares, the same modules the deterministic tools read, and SHALL NOT keep a modules setting of its own, so that moving a product's code never leaves the review looking elsewhere.

#### Scenario Outline: modules declared at `<modules>` judge `<judged>` of `<count>` files

- **GIVEN** the product declares its modules at `<modules>` <!-- productDeclaresModules -->
- **AND** `<count>` core files sit under `<folder>` <!-- coreFilesUnder -->
- **AND** no pass is recorded <!-- noPassRecorded -->
- **WHEN** `factory review` runs <!-- reviewRuns -->
- **THEN** `<judged>` files are sent to the model <!-- filesJudged -->

##### Examples:

  | modules   | folder  | count | judged |
  | --------- | ------- | ----- | ------ |
  | factory/* | factory | 3     | 3      |
  | src/*     | src     | 3     | 3      |

### Requirement: review-reports-incomplete · a review that judged nothing or skipped a row says so

`@by:agent`

`factory review` SHALL report the run incomplete and exit with status 4, naming each cause, when the folders its rows ask select no core file of a product that has core files, when a rubric row is rejected as not generic, or when a call to the decision model fails, so that a review that judged nothing is never read as a clean pass.

#### Scenario Outline: `<selected>` selected files and `<rejected>` rejected rows leave the review `<outcome>`

- **GIVEN** a product with `<count>` core files <!-- productWithCoreFiles -->
- **AND** the asked folders select `<selected>` of them <!-- foldersSelect -->
- **AND** the rubric has `<rejected>` rejected rows <!-- rubricRejectedRows -->
- **AND** the decision model `<model>` <!-- decisionModelState -->
- **WHEN** `factory review` runs <!-- reviewRuns -->
- **THEN** the review reports `<outcome>` <!-- reviewReports -->
- **AND** it exits with status `<status>` <!-- exitStatus -->

##### Examples:

  | count | selected | rejected | model   | outcome                          | status |
  | ----- | -------- | -------- | ------- | -------------------------------- | ------ |
  | 3     | 3        | 0        | answers | complete                         | 0      |
  | 3     | 0        | 0        | answers | incomplete: no core file selected | 4      |
  | 3     | 3        | 1        | answers | incomplete: a row was rejected   | 4      |
  | 3     | 3        | 0        | fails   | incomplete: the model failed     | 4      |

## MODIFIED Requirements

### Requirement: review-apart-from-verdict · review exits zero and runs after the deterministic tools

`@by:agent`

`factory review` SHALL exit with status 0 whatever warnings it finds when its run is complete, SHALL NOT be part of `factory check`, and in the harness order SHALL run after the deterministic tools, because a model call spends tokens that a deterministic finding makes unnecessary. An incomplete run exits with status 4.

#### Scenario Outline: the review prints `<warnings>` warnings and exits zero

- **GIVEN** a core whose touched files raise `<warnings>` rubric warnings <!-- touchedFilesRaise -->
- **WHEN** `factory review` runs <!-- reviewRuns -->
- **THEN** it exits with status `<status>` <!-- exitStatus -->
- **AND** the output lists `<warnings>` warnings <!-- warningsListed -->

##### Examples:

  | warnings | status |
  | -------- | ------ |
  | 0        | 0      |
  | 3        | 0      |
