## MODIFIED Requirements

### Requirement: Feedback updates the change it is about

`@by:agent`

Feedback SHALL update the affected change regardless of its source. Ordinary findings SHALL stay in that change. For a reproducible defect in the reviewer, a separately tracked repair MAY proceed under a repair plan explicitly approved for that reviewer and rule when a standing spec uniquely determines the outcome and the reviewer is within scope. The repair SHALL prove the failing case and continued rejection of a genuine violation. An ambiguous rule, a change of policy or a repair outside that authorization SHALL go to the person. The original change SHALL resume after the corrected reviewer passes the same cases.

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

#### Scenario Outline: a reviewer finding with `<authority>` and `<rule>` leads to `<next>`

- **GIVEN** the approved repair scope grants `<authority>` for reviewer repairs <!-- reviewerRepairAuthority -->
- **AND** the standing rule gives `<rule>` for the reproduced case <!-- standingRuleGives -->
- **WHEN** the reviewer finding is taken in <!-- takeReviewerFinding -->
- **THEN** the next action is `<next>` <!-- reviewerFindingAction -->

##### Examples:

  | authority                | rule                  | next                            |
  | ------------------------ | --------------------- | ------------------------------- |
  | repair in the owned repo | one specified outcome | track and test a separate repair |
  | repair in the owned repo | two plausible outcomes | ask which outcome to require    |
  | no authority             | one specified outcome | ask for the repair decision     |
