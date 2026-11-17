# flow/implement Specification

## Purpose

Implementing a change: every pending phase of a ready change is built in one run, in order, each one's seams first and then the schema's workstreams, and whatever the plan does not settle goes back as feedback instead of being decided while building.

## Requirements

### Requirement: Only a ready change is implemented

The implement phase SHALL start only a change that validation reports as ready. For any other it SHALL build nothing and SHALL say what validation found.

#### Scenario Outline: starting a `<readiness>` change builds `<phasesBuilt>` phase(s)

- **GIVEN** a change that validation reports `<readiness>` <!-- changeValidationReports -->
- **AND** `<pending>` phase(s) of its plan have unchecked tasks <!-- phasesWithUncheckedTasks -->
- **WHEN** the implementation of the change is started <!-- startImplementation -->
- **THEN** `<phasesBuilt>` phase(s) are built <!-- phasesBuilt -->
- **AND** `<pendingAfter>` phase(s) have unchecked tasks afterwards <!-- phasesPendingAfter -->

##### Examples:

  | readiness | pending | phasesBuilt | pendingAfter |
  | --------- | ------- | ----------- | ------------ |
  | not ready | 2       | 0           | 2            |

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

### Requirement: The seams of a phase exist before any workstream starts

The implement phase SHALL write every seam the phase declares before the first workstream of that phase starts, so that each workstream builds against signatures that are already fixed.

#### Scenario Outline: a phase declaring `<seams>` seam(s) has them when its first workstream starts

- **GIVEN** a change that validation reports `<readiness>` <!-- changeValidationReports -->
- **AND** the next phase of its plan declares `<seams>` seam(s) <!-- nextPhaseDeclaresSeams -->
- **WHEN** the implementation of the change is started <!-- startImplementation -->
- **THEN** `<seams>` seam(s) exist in the product when the first workstream starts <!-- seamsExistAtFirstWorkstream -->

##### Examples:

  | readiness | seams |
  | --------- | ----- |
  | ready     | 3     |
  | ready     | 0     |

### Requirement: What the plan does not settle goes back as feedback

When a workstream cannot go on without a decision the plan does not settle and the agent cannot take, the implement phase SHALL stop that phase, SHALL raise feedback naming the change, the workstream and the task, and SHALL leave the change's plan and delta specs as they were. Workstreams already finished SHALL stay as they are.

#### Scenario Outline: `<workstream>` blocked on `<unsettled>` unsettled decision(s) raises feedback

- **GIVEN** a change that validation reports `<readiness>` <!-- changeValidationReports -->
- **AND** the next phase leaves `<unsettled>` decision(s) unsettled for the workstream `<workstream>` <!-- phaseLeavesUnsettledFor -->
- **WHEN** the implementation of the change is started <!-- startImplementation -->
- **THEN** feedback is raised naming the workstream `<workstream>` <!-- feedbackNamesWorkstream -->
- **AND** `<artifactsChanged>` artifact(s) of the change were changed by the implement phase <!-- artifactsChangedByImplement -->

##### Examples:

  | readiness | unsettled | workstream     | artifactsChanged |
  | --------- | --------- | -------------- | ---------------- |
  | ready     | 1         | infrastructure | 0                |
  | ready     | 2         | app-domain     | 0                |

### Requirement: The spike workstream builds the approved screens and writes their end-to-end tests

In a change whose schema declares a spike workstream, that workstream SHALL be the first the implementation builds for the screens listed under `## Screens`: it SHALL build each one from its approved spike, against stub controllers that return the spike's literal data, and SHALL write the end-to-end test of every journey the screen lists, under `test/e2e/<module>/`, with the actions in natural language and deterministic checks on what the screen shows, passing against the stubs. When a journey writes, the stub controller behind its screen SHALL keep that literal data in its own local state and apply the write to it, with no store and no query cache, so that the screen shows the result. The workstreams built after it SHALL keep those tests passing as the real controllers, use cases and in-memory adapters take the stubs' place. The first web change of a product SHALL write the end-to-end configuration from the product's local-run procedure.

#### Scenario Outline: the journey `<journey>` is `<state>` once `<workstream>` is built

- **GIVEN** a web change whose screen lists the journey `<journey>` <!-- screenListsJourney -->
- **WHEN** the implementation has built `<workstream>` <!-- implementationBuilt -->
- **THEN** the end-to-end test of `<journey>` is `<state>` <!-- e2eTestState -->

##### Examples:

  | journey                | workstream  | state                                   |
  | ---------------------- | ----------- | --------------------------------------- |
  | cancel a pending order | react-ui    | passing against the stub controllers    |
  | cancel a pending order | react-hooks | passing against the in-memory adapters  |

#### Scenario Outline: the stub behind `<action>` paints `<after>` once the action is done

- **GIVEN** a screen built from its spike that paints `<before>` and offers `<action>` <!-- builtScreenOffersAction -->
- **WHEN** the end-to-end test performs `<action>` against the stub controllers <!-- e2eTestPerformsAction -->
- **THEN** the screen paints `<after>` <!-- screenPaints -->
- **AND** the stub controller keeps the written value in its own local state, with no store and no query cache <!-- stubKeepsWriteLocally -->

##### Examples:

  | before  | action           | after     |
  | ------- | ---------------- | --------- |
  | Pending | pay invoice 2    | Paid      |
  | Pending | cancel order O-1 | Cancelled |
