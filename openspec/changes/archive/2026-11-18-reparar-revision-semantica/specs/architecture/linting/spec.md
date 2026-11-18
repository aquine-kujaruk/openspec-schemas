## ADDED Requirements

### Requirement: A rubric row is verified by counterexample and by reference

`@by:person`

A rubric row SHALL have a counterexample expecting yes and a closely matched reference expecting no under `## <row> · <slug>` in the layer's `examples.md`. `factory expect` SHALL submit every file of the case together. With model probability p for yes, confidence SHALL equal p for an expected yes and 1−p for an expected no. At 95% or above the case SHALL pass. At 90% up to but excluding 95% it SHALL pass with a warning. Below 90% it SHALL fail and SHALL NOT record a new expectation. Every accepted block SHALL include verdict, raw score, model and a fingerprint covering model, question and files.

#### Scenario Outline: Recording <case> at <score> produces <state>

- **GIVEN** rubric case `<case>` expects `<expected>` <!-- rubricCaseIn -->
- **AND** the model returns probability `<score>` for yes <!-- modelScores -->
- **WHEN** its judgement is recorded <!-- expectRuns -->
- **THEN** its confidence classification is `<state>` <!-- confidenceIs -->
- **AND** its expectation records `<recorded>` <!-- expectBlockRecords -->

##### Examples:

  | case | expected | score | state | recorded |
  | --- | --- | --- | --- | --- |
  | wrapper-id | yes | 0.95 | target | yes |
  | wrapper-id | yes | 0.90 | warning | yes |
  | wrapper-id | yes | 0.8999 | failed | nothing |
  | wrapper-id | yes | 0.01 | failed | nothing |
  | reference | no | 0.05 | target | no |
  | reference | no | 0.10 | warning | no |
  | reference | no | 0.1001 | failed | nothing |
  | reference | no | 0.99 | failed | nothing |

### Requirement: A recorded judgement is replayed without the model

`@by:person`

A generated test SHALL replay a matching recording without a model call. A changed question, model or case file SHALL require a fresh judgement, and without the configured key the test SHALL fail naming the case and `factory expect`. Recording with `--changed` SHALL reuse the latest real observation of the matching version, including when the expectation is missing. Replay SHALL leave the history intact.

#### Scenario Outline: Replaying <change> with key <key> makes <calls> calls

- **GIVEN** a recorded case with change `<change>` <!-- recordedRubricCase -->
- **AND** the key is `<key>` <!-- reviewKeyIs -->
- **WHEN** its judgement is requested <!-- generatedTestsRun -->
- **THEN** the model is called `<calls>` times <!-- modelCalled -->
- **AND** the result is `<result>` <!-- testResult -->

##### Examples:

  | change | key | calls | result |
  | --- | --- | --- | --- |
  | none | absent | 0 | replayed |
  | case | present | 1 | live |
  | question | present | 1 | live |
  | model | present | 1 | live |
  | case | absent | 0 | missing |
  | question | absent | 0 | missing |
  | model | absent | 0 | missing |

### Requirement: Every judgement joins a history the report reads

`@by:person`

Each live judgement SHALL append its probability, timestamp, model and fingerprints to the layer's score history. The Vitest report SHALL show the case, expected verdict, raw score, confidence, classification, history, difference from the mean of all preceding scores, version changes and live or replay status. An absolute difference of at least 20 percentage points SHALL raise an independent warning. The expected-verdict confidence SHALL determine whether the case passes. One policy SHALL apply to every version of every case.

#### Scenario Outline: History <history> followed by <score> yields <state> with drift <drift>

- **GIVEN** a counterexample with historical scores `<history>` <!-- scoreHistory -->
- **WHEN** the model scores it `<score>` <!-- modelScores -->
- **THEN** the report classifies it as `<state>` <!-- reportShows -->
- **AND** the historical warning is `<drift>` <!-- historicalWarningIs -->
- **AND** the test `<result>` <!-- testResult -->

##### Examples:

  | history | score | state | drift | result |
  | --- | --- | --- | --- | --- |
  | none | 0.95 | target | absent | passes |
  | 0.97 0.96 0.97 | 0.95 | target | absent | passes |
  | 0.75 | 0.95 | target | present | passes |
  | 0.72 | 0.91 | warning | absent | passes |
  | 0.70 | 0.90 | warning | present | passes |
  | 0.92 0.91 0.93 | 0.64 | failed | present | fails |
