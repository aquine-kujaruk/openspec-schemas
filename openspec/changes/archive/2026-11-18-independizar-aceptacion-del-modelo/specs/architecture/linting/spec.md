## MODIFIED Requirements

### Requirement: A rubric row is verified by counterexample and by reference

`@by:person`

Each rubric row SHALL declare at least one counterexample expecting yes and one closely matched reference expecting no. Each case SHALL declare its expected answer as yes or no. A case with an invalid declaration SHALL be rejected. Changing the configured decision model SHALL leave the declared inputs and expected answers intact. The configured evaluator SHALL receive all files of the case together. Confidence SHALL be the probability of yes for an expected yes, and its complement for an expected no. At 95% or above the case SHALL pass. From 90% inclusive to below 95% it SHALL pass with a warning. Below 90% it SHALL fail.

#### Scenario Outline: Recording <case> at <score> produces <state>

- **GIVEN** a case declaring `<answer>` as its expected answer <!-- declaredAnswer -->
- **WHEN** its files are evaluated with yes probability `<score>` <!-- evaluatedProbability -->
- **THEN** the recorded evidence is classified as `<state>` <!-- confidenceResult -->
- **AND** the declaration stays as written <!-- declarationUnchanged -->

##### Examples:

  | case | answer | score | state |
  | --- | --- | --- | --- |
  | wrapper-id | yes | 0.95 | target |
  | wrapper-id | yes | 0.90 | warning |
  | wrapper-id | yes | 0.8999 | failed |
  | wrapper-id | yes | 0.01 | failed |
  | reference | no | 0.05 | target |
  | reference | no | 0.10 | warning |
  | reference | no | 0.1001 | failed |
  | reference | no | 0.99 | failed |

#### Scenario Outline: A declaration of <declaration> is <outcome>

- **GIVEN** a case declaring `<declaration>` <!-- caseDeclaration -->
- **WHEN** the acceptance cases are checked <!-- declarationsChecked -->
- **THEN** the declaration is `<outcome>` <!-- declarationOutcome -->

##### Examples:

  | declaration | outcome |
  | --- | --- |
  | yes | accepted |
  | no | accepted |
  | a score and model name | rejected |
  | missing | rejected |

### Requirement: A recorded judgement is replayed without the model

`@by:person`

The acceptance check SHALL reuse the latest recorded judgement matching the case files, question and configured evaluator. If matching evidence is missing, the check SHALL obtain a fresh judgement when the evaluator is available, or fail naming the case and the command to refresh its evidence. Evaluating or reusing a judgement SHALL leave the acceptance declaration intact. A failed judgement SHALL remain visible in the history.

#### Scenario Outline: Replaying <change> with key <key> makes <calls> calls

- **GIVEN** a case with existing evidence and change `<change>` <!-- evidenceChange -->
- **WHEN** acceptance is checked with the evaluator key `<key>` <!-- acceptanceChecked -->
- **THEN** it makes `<calls>` evaluator calls <!-- evaluatorCalls -->
- **AND** the reported evidence is `<evidence>` <!-- usedEvidence -->
- **AND** the declaration stays as written <!-- declarationUnchanged -->

##### Examples:

  | change | key | calls | evidence |
  | --- | --- | --- | --- |
  | none | absent | 0 | replayed |
  | case | present | 1 | fresh |
  | question | present | 1 | fresh |
  | model | present | 1 | fresh |
  | case | absent | 0 | missing |
  | question | absent | 0 | missing |
  | model | absent | 0 | missing |

### Requirement: Every judgement joins a history the report reads

`@by:person`

Each live judgement SHALL append its probability, timestamp, evaluator identity and input fingerprints to its evidence history. The report SHALL show the case, expected answer, raw probability, confidence, classification, history, difference from the mean of preceding scores, version changes and whether the judgement was live or replayed. An absolute difference of at least 20 percentage points SHALL raise an independent warning. The expected-answer confidence SHALL determine whether the case passes. One policy SHALL apply to every version of every case.

#### Scenario Outline: History <history> followed by <score> yields <state> with drift <drift>

- **GIVEN** a counterexample with the score history `<history>` <!-- scoreHistory -->
- **WHEN** the evaluator returns probability `<score>` <!-- modelScores -->
- **THEN** the report classifies it as `<state>` <!-- reportShows -->
- **AND** the historical warning is `<drift>` <!-- historicalWarningIs -->
- **AND** the check `<result>` <!-- testResult -->

##### Examples:

  | history | score | state | drift | result |
  | --- | --- | --- | --- | --- |
  | none | 0.95 | target | absent | passes |
  | 0.97 0.96 0.97 | 0.95 | target | absent | passes |
  | 0.75 | 0.95 | target | present | passes |
  | 0.72 | 0.91 | warning | absent | passes |
  | 0.70 | 0.90 | warning | present | passes |
  | 0.92 0.91 0.93 | 0.64 | failed | present | fails |
