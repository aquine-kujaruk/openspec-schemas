## RENAMED Requirements

- FROM: `### Requirement: One phase is built per run`
- TO: `### Requirement: Every pending phase is built in one run, in order`

## MODIFIED Requirements

### Requirement: Every pending phase is built in one run, in order

Once the person has started the implementation of a ready change, a run of the implement phase SHALL build every phase of the plan that has unchecked tasks, in the plan's order, without asking the person between phases. It SHALL check off each task as it is done, SHALL start a phase only once the previous one's verification task passes, and SHALL then start the next phase itself. It SHALL stop before the last phase only when feedback is raised, when a check keeps failing and the agent cannot fix it, or when something only the person can give is missing. Once no task is left, the run SHALL go on to verify the change.

#### Scenario Outline: a run on a change with `<pending>` pending phase(s) leaves `<pendingAfter>`

- **GIVEN** a change that validation reports `<readiness>` <!-- changeValidationReports -->
- **AND** `<pending>` phase(s) of its plan have unchecked tasks <!-- phasesWithUncheckedTasks -->
- **WHEN** the implementation of the change is started <!-- startImplementation -->
- **THEN** `<phasesBuilt>` phase(s) are built <!-- phasesBuilt -->
- **AND** `<pendingAfter>` phase(s) have unchecked tasks afterwards <!-- phasesPendingAfter -->

##### Examples:

  | readiness | pending | phasesBuilt | pendingAfter |
  | --------- | ------- | ----------- | ------------ |
  | ready     | 3       | 3           | 0            |
  | ready     | 2       | 2           | 0            |
  | ready     | 1       | 1           | 0            |
  | ready     | 0       | 0           | 0            |

#### Scenario Outline: a run whose phase `<stoppedAt>` of `<pending>` meets `<obstacle>` builds `<phasesBuilt>` phase(s)

- **GIVEN** a change that validation reports `<readiness>` <!-- changeValidationReports -->
- **AND** `<pending>` phase(s) of its plan have unchecked tasks <!-- phasesWithUncheckedTasks -->
- **AND** its phase `<stoppedAt>` meets `<obstacle>` <!-- phaseMeets -->
- **WHEN** the implementation of the change is started <!-- startImplementation -->
- **THEN** `<phasesBuilt>` phase(s) are built <!-- phasesBuilt -->
- **AND** the person was asked `<asked>` time(s) <!-- personAskedTimes -->

##### Examples:

  | readiness | pending | stoppedAt | obstacle                                  | phasesBuilt | asked |
  | --------- | ------- | --------- | ----------------------------------------- | ----------- | ----- |
  | ready     | 3       | none      | nothing                                   | 3           | 0     |
  | ready     | 3       | 2         | a decision the plan does not settle       | 1           | 1     |
  | ready     | 3       | 3         | a key only the person can add             | 2           | 1     |
  | ready     | 2       | 1         | a check the agent cannot make pass        | 0           | 1     |

#### Scenario Outline: once `<pendingAfter>` phase(s) are left, the run `<verifies>`

- **GIVEN** a change that validation reports `<readiness>` <!-- changeValidationReports -->
- **AND** `<pending>` phase(s) of its plan have unchecked tasks <!-- phasesWithUncheckedTasks -->
- **WHEN** the implementation of the change is started <!-- startImplementation -->
- **THEN** `<pendingAfter>` phase(s) have unchecked tasks afterwards <!-- phasesPendingAfter -->
- **AND** the run `<verifies>` <!-- runVerifies -->

##### Examples:

  | readiness | pending | pendingAfter | verifies                    |
  | --------- | ------- | ------------ | --------------------------- |
  | ready     | 2       | 0            | verifies the change         |
