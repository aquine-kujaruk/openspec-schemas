## ADDED Requirements

### Requirement: A rubric row is verified by counterexample and by reference

`@by:person`

A rubric row SHALL be proven like a rule: under `## <row> · <slug>` in the `examples.md` of the layer it is asked over, at least one case the row's question answers yes and one closely matched case it answers no. `factory expect` SHALL judge each case with the configured decision model, sending every file of the case as one state, and SHALL record in its `expect` block the verdict, the score and a fingerprint of the question, the files and the model. A case scored between 0.15 and 0.85 is ambiguous: `factory expect` SHALL list it and SHALL NOT record it.

#### Scenario Outline: case `<case>` of `<row>` scored `<score>` is recorded as `<recorded>`

- **GIVEN** case `<case>` under rubric row `<row>` in `<layer>.examples.md` <!-- rubricCaseIn -->
- **AND** the decision model scores it `<score>` <!-- modelScores -->
- **WHEN** `factory expect` runs <!-- expectRuns -->
- **THEN** its `expect` block records `<recorded>` <!-- expectBlockRecords -->

##### Examples:

  | layer  | row | case       | score | recorded                     |
  | ------ | --- | ---------- | ----- | ---------------------------- |
  | domain | S17 | wrapper-id | 0.97  | a yes verdict with its score |
  | domain | S17 | reference  | 0.03  | a no verdict with its score  |
  | domain | S17 | quantity   | 0.55  | nothing, listed as ambiguous |

### Requirement: A recorded judgement is replayed without the model

`@by:person`

The generated test of a rubric case SHALL compare with its recorded judgement without calling the model while the case's fingerprint matches. When the fingerprint differs, it SHALL judge the case again if the configured key is present, and SHALL fail naming the case and `factory expect` if it is absent.

#### Scenario Outline: a `<fingerprint>` fingerprint with the key `<key>` makes `<calls>` model calls and the test `<result>`

- **GIVEN** rubric case `<case>` with a recorded judgement <!-- recordedRubricCase -->
- **AND** its fingerprint is `<fingerprint>` <!-- fingerprintIs -->
- **AND** the review key is `<key>` <!-- reviewKeyIs -->
- **WHEN** the generated tests run <!-- generatedTestsRun -->
- **THEN** the model is called `<calls>` times <!-- modelCalled -->
- **AND** the test `<result>` <!-- testResult -->

##### Examples:

  | case       | fingerprint | key     | calls | result                              |
  | ---------- | ----------- | ------- | ----- | ----------------------------------- |
  | wrapper-id | unchanged   | absent  | 0     | passes                              |
  | wrapper-id | changed     | present | 1     | passes when the verdict holds       |
  | wrapper-id | changed     | absent  | 0     | fails naming `factory expect`       |

### Requirement: Every judgement joins a history the report reads

`@by:person`

Each judgement SHALL be added to the layer's score history with its model and the fingerprints of its question and case. After the generated tests, a report SHALL list per layer every judged case with its history, its score now, the difference from the history's mean and its state: stable, degraded (a difference of 0.2 or more), ambiguous or new. A degraded or ambiguous case SHALL fail.

#### Scenario Outline: a case with history `<history>` scored `<score>` is `<state>`

- **GIVEN** rubric case `<case>` with the score history `<history>` <!-- scoreHistory -->
- **AND** the decision model scores it `<score>` <!-- modelScores -->
- **WHEN** the generated tests run <!-- generatedTestsRun -->
- **THEN** the report shows the case as `<state>` <!-- reportShows -->
- **AND** the test `<result>` <!-- testResult -->

##### Examples:

  | case             | history        | score | state     | result |
  | ---------------- | -------------- | ----- | --------- | ------ |
  | wrapper-id       | 0.97 0.96 0.97 | 0.95  | stable    | passes |
  | topology-service | 0.92 0.91 0.93 | 0.64  | degraded  | fails  |
  | aggregate-of-one | 0.93 0.90 0.87 | 0.80  | ambiguous | fails  |
  | subtle-comment   | none           | 0.08  | new       | passes |
