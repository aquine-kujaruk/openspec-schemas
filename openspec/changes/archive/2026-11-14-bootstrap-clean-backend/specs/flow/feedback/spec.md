## Purpose

Taking in feedback: a finding about a change, whoever raises it, goes back into that same change. Its artifacts are updated, only what the finding invalidates is reopened, and the flow goes on from implementation.

## ADDED Requirements

### Requirement: Feedback updates the change it is about

The feedback phase SHALL update the plan, and the delta specs when behaviour is affected, of the change the feedback is about, and SHALL open no other change. Feedback SHALL be taken in the same way whether it comes from the person, the completion gate, the verify phase or the archive.

#### Scenario Outline: feedback from `<source>` about `<change>` leaves `<activeAfter>` active change(s)

- **GIVEN** a project with `<activeBefore>` active change(s), `<change>` among them <!-- activeChangesAmong -->
- **AND** the plan of `<change>` holds `<entriesBefore>` feedback entr(ies) <!-- planFeedbackEntriesBefore -->
- **WHEN** feedback from `<source>` about `<change>` is taken in <!-- takeInFeedback -->
- **THEN** the project has `<activeAfter>` active change(s) <!-- activeChangesAfter -->
- **AND** the plan of `<change>` holds `<entriesAfter>` feedback entr(ies) <!-- planFeedbackEntriesAfter -->

##### Examples:

  | activeBefore | change     | entriesBefore | source              | activeAfter | entriesAfter |
  | ------------ | ---------- | ------------- | ------------------- | ----------- | ------------ |
  | 1            | add-orders | 0             | the person          | 1           | 1            |
  | 1            | add-orders | 0             | the completion gate | 1           | 1            |
  | 2            | add-orders | 1             | the verify phase    | 2           | 2            |
  | 1            | add-orders | 0             | the archive         | 1           | 1            |

### Requirement: Feedback reopens only what it invalidates

When feedback names a phase of the plan, the feedback phase SHALL uncheck the tasks of that phase and of the phases after it, and SHALL leave the phases before it as they were.

#### Scenario Outline: feedback naming phase `<phase>` turns the done phases `<doneBefore>` into `<doneAfter>`

- **GIVEN** a project with `<activeBefore>` active change(s), `<change>` among them <!-- activeChangesAmong -->
- **AND** the phases of its plan that are done are `<doneBefore>` <!-- phasesDoneBefore -->
- **AND** the feedback names the phase `<phase>` <!-- feedbackNamesPhase -->
- **WHEN** feedback from `<source>` about `<change>` is taken in <!-- takeInFeedback -->
- **THEN** the phases of its plan that are done are `<doneAfter>` <!-- phasesDoneAfter -->

##### Examples:

  | activeBefore | change     | doneBefore | phase | source           | doneAfter |
  | ------------ | ---------- | ---------- | ----- | ---------------- | --------- |
  | 1            | add-orders | 1, 2       | 2     | the verify phase | 1         |
  | 1            | add-orders | 1, 2       | 1     | the verify phase | none      |
  | 1            | add-orders | 1          | 2     | the person       | 1         |

### Requirement: Feedback the agent cannot settle becomes an open question

When feedback needs a decision only the person can take, the feedback phase SHALL list it in the plan as an open question, which leaves the change not ready until the person answers. Feedback the agent can settle SHALL leave no open question.

#### Scenario Outline: feedback needing `<open>` decision(s) from the person leaves the change `<readiness>`

- **GIVEN** a project with `<activeBefore>` active change(s), `<change>` among them <!-- activeChangesAmong -->
- **AND** the feedback needs `<open>` decision(s) only the person can take <!-- feedbackNeedsDecisions -->
- **WHEN** feedback from `<source>` about `<change>` is taken in <!-- takeInFeedback -->
- **THEN** the plan of `<change>` lists `<open>` open question(s) <!-- planListsOpenQuestions -->
- **AND** validation reports the change `<readiness>` <!-- validationReportsChange -->

##### Examples:

  | activeBefore | change     | open | source           | readiness |
  | ------------ | ---------- | ---- | ---------------- | --------- |
  | 1            | add-orders | 1    | the verify phase | not ready |
  | 1            | add-orders | 0    | the verify phase | ready     |
