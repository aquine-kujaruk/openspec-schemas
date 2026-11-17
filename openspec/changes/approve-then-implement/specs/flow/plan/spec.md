## MODIFIED Requirements

### Requirement: Each answer updates the artifacts at once

`@by:person`

When the person answers open questions, the plan phase SHALL record each answered decision in the artifacts in that same update, tagged as taken by the person, and SHALL remove its question from the plan.

#### Scenario Outline: answering `<answered>` of `<openBefore>` leaves `<open>` open

- **GIVEN** a change whose plan lists `<openBefore>` open question(s) <!-- planWithOpenQuestions -->
- **WHEN** the person answers `<answered>` of them <!-- answerQuestions -->
- **THEN** the plan lists `<open>` open question(s) <!-- planListsOpenQuestions -->
- **AND** `<recorded>` answered decision(s) are recorded in the artifacts <!-- answeredDecisionsRecorded -->
- **AND** `<recorded>` recorded decision(s) are tagged as taken by the person <!-- recordedDecisionsByPerson -->

##### Examples:

  | openBefore | answered | open | recorded |
  | ---------- | -------- | ---- | -------- |
  | 2          | 1        | 1    | 1        |
  | 2          | 2        | 0    | 2        |

## ADDED Requirements

### Requirement: The person's approval is the plan's last question and shows the artifacts themselves

`@by:person`

From the first proposal on, the last open question of a plan SHALL ask the person to approve it, and SHALL link the change's plan, each of its delta specs and each of its spikes, so that the person reads the artifacts and not a summary of them. An approval SHALL be recorded in the plan with its date. When an answer given with the approval picks another option than the plan proposed, the plan phase SHALL update the artifacts, SHALL NOT record the approval, and SHALL ask it again.

#### Scenario Outline: approving with `<otherAnswers>` leaves the plan `<approval>` and `<open>` open question(s)

- **GIVEN** a change whose plan lists `<openBefore>` open question(s), the last one its approval <!-- planWithApprovalLast -->
- **WHEN** the person approves it, answering the others `<otherAnswers>` <!-- approveAnswering -->
- **THEN** the plan is `<approval>` <!-- planApprovalIs -->
- **AND** the plan lists `<open>` open question(s) <!-- planListsOpenQuestions -->

##### Examples:

  | openBefore | otherAnswers               | approval     | open |
  | ---------- | -------------------------- | ------------ | ---- |
  | 1          | none                       | approved     | 0    |
  | 3          | as the plan proposed       | approved     | 0    |
  | 3          | one against the proposal   | not approved | 1    |

#### Scenario Outline: the approval of a change with `<specs>` delta spec(s) and `<spikes>` spike(s) links `<links>` artifact(s)

- **GIVEN** a change with `<specs>` delta spec(s) and `<spikes>` spike(s) <!-- changeWithSpecsAndSpikes -->
- **WHEN** the plan phase asks for the approval <!-- askApproval -->
- **THEN** the question links `<links>` artifact(s) of the change <!-- approvalLinksArtifacts -->

##### Examples:

  | specs | spikes | links |
  | ----- | ------ | ----- |
  | 0     | 0      | 1     |
  | 2     | 0      | 3     |
  | 1     | 2      | 4     |

### Requirement: An approved plan goes on to the implementation in the same turn

`@by:person`

Once the plan is approved and the change is ready, the plan phase SHALL hand the change to the implementation the project configures in that same turn, without asking the person again.

#### Scenario Outline: a plan `<approval>` and `<readiness>` is `<outcome>`

- **GIVEN** a change whose plan is `<approval>` <!-- planApprovalIs -->
- **AND** validation reports it `<readiness>` <!-- changeValidationReports -->
- **WHEN** the plan phase ends its turn <!-- endPlanTurn -->
- **THEN** the change is `<outcome>` <!-- changeOutcome -->
- **AND** the person was asked `<asked>` more time(s) <!-- personAskedMoreTimes -->

##### Examples:

  | approval     | readiness | outcome                       | asked |
  | ------------ | --------- | ----------------------------- | ----- |
  | approved     | ready     | handed to the implementation  | 0     |
  | not approved | not ready | waiting for the person        | 0     |
