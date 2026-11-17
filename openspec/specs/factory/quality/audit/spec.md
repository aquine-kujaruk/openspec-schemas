# factory/quality/audit Specification

## Purpose
Review the judgement rules of the architecture (the reviewer rubric) with a calibrated decision model, apart from the binary verdict: `factory review` asks each rubric row as a yes/no question over the touched files, narrows every yes to the lines that carry it, and prints warnings with their certainty. It never fails the pipeline and never names a product.

## Requirements

### Requirement: review-apart-from-verdict · review exits zero and runs after the deterministic tools

`@by:agent`

`factory review` SHALL exit with status 0 whatever it finds, SHALL NOT be part of `factory check`, and in the harness order SHALL run after the deterministic tools, because a model call spends tokens that a deterministic finding makes unnecessary.

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

### Requirement: review-needs-configured-key · review refuses to run without the configured key

`@by:agent`

`factory review` SHALL read the decision model's API key from the variable the harness configuration names in `.env`, and when the variable is absent SHALL print the variable's name and exit with status 2 without calling the model, so the caller can tell a review that did not run from one that found nothing.

#### Scenario Outline: a `<key>` key leads to `<outcome>`

- **GIVEN** the configured key variable is `<key>` <!-- keyVariableState -->
- **WHEN** `factory review` runs <!-- reviewRuns -->
- **THEN** the outcome is `<outcome>` <!-- reviewOutcome -->

##### Examples:

  | key     | outcome                                   |
  | ------- | ----------------------------------------- |
  | present | the model is called and warnings print    |
  | absent  | the variable's name prints and status is 2 |

### Requirement: review-scopes-touched-files · review judges only the files touched since its last pass

`@by:agent`

`factory review` SHALL judge only the core files changed since the pass it last recorded, and when no pass is recorded, or the recorded pass judged under another rubric (a row's question or folders changed), SHALL judge every core file; a file untouched since a pass that cleared it under the same rubric is not sent to the model again.

#### Scenario Outline: `<touched>` touched files after `<previous>` are judged

- **GIVEN** the last recorded pass is `<previous>` <!-- lastRecordedPass -->
- **AND** `<touched>` core files changed since then <!-- filesTouchedSince -->
- **WHEN** `factory review` runs <!-- reviewRuns -->
- **THEN** `<judged>` files are sent to the model <!-- filesJudged -->

##### Examples:

  | previous | touched | judged |
  | -------- | ------- | ------ |
  | none     | 2       | all    |
  | recorded | 2       | 2      |
  | recorded | 0       | 0      |
  | recorded under another rubric | 0 | all |

### Requirement: review-narrows-to-lines · review narrows every finding from files to lines

`@by:agent`

For every rubric row answered yes over a set of files, `factory review` SHALL ask again over the classes, methods and interfaces of each answering file, split with the AST, and SHALL keep narrowing the answering span until it reports line ranges; a file MAY yield several ranges for one row.

#### Scenario Outline: a row found in `<unit>` is reported as `<ranges>` ranges

- **GIVEN** a file whose `<unit>` carries a rubric finding <!-- unitCarriesFinding -->
- **WHEN** `factory review` narrows the finding <!-- reviewNarrows -->
- **THEN** the output reports `<ranges>` line ranges for that file <!-- rangesReported -->

##### Examples:

  | unit                   | ranges |
  | ---------------------- | ------ |
  | one method             | 1      |
  | two methods            | 2      |
  | the whole class header | 1      |

### Requirement: review-finding-names-row-and-certainty · every review warning names its row, certainty, file and lines

`@by:agent`

Every warning `factory review` prints SHALL carry the rubric row id, the model's probability for that row, the file path and the line range; a row whose probability stays below the configured certainty threshold SHALL print nothing.

#### Scenario Outline: probability `<probability>` against threshold `<threshold>` prints `<printed>`

- **GIVEN** the certainty threshold is `<threshold>` <!-- certaintyThreshold -->
- **AND** the model answers `<probability>` for row `<row>` on a span <!-- modelAnswers -->
- **WHEN** `factory review` reports <!-- reviewReports -->
- **THEN** the warning printed is `<printed>` <!-- warningPrinted -->

##### Examples:

  | row | probability | threshold | printed                                      |
  | --- | ----------- | --------- | -------------------------------------------- |
  | S09 | 0.93        | 0.85      | S09 p=0.93 at the file and lines of the span |
  | S09 | 0.60        | 0.85      | nothing                                      |
  | S05 | 0.85        | 0.85      | S05 p=0.85 at the file and lines of the span |

### Requirement: review-rows-are-generic · rubric questions name no product

`@by:agent`

Every rubric row `factory review` asks SHALL be a generic yes/no question about the architecture (a technology named in the domain, a domain object built by a repository) and SHALL NOT name a library, a provider or a business concept of one product, so the same command serves every application built with the package.

#### Scenario Outline: the row `<row>` worded as `<wording>` is `<verdict>`

- **GIVEN** a rubric row `<row>` worded `<wording>` <!-- rowWorded -->
- **WHEN** the rubric is loaded <!-- rubricLoaded -->
- **THEN** the row is `<verdict>` <!-- rowVerdict -->

##### Examples:

  | row | wording                                                        | verdict  |
  | --- | -------------------------------------------------------------- | -------- |
  | S09 | this domain file names a technology, library or provider       | accepted |
  | S09 | this domain file names the payment provider of the product     | rejected |

### Requirement: review-asks-core-and-schema-rows · review asks the rows of the core and the rows of the schema

`@by:agent`

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
