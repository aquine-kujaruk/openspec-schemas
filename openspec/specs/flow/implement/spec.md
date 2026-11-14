# flow/implement Specification

## Purpose

Implementing a change: one phase of a ready change is built per run, its seams first and then the schema's workstreams, and whatever the plan does not settle goes back as feedback instead of being decided while building.

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

### Requirement: One phase is built per run

Each run of the implement phase SHALL build the first phase of the plan that has unchecked tasks, SHALL check off its tasks as they are done, and SHALL stop when that phase's verification task passes.

#### Scenario Outline: a run on a change with `<pending>` pending phase(s) leaves `<pendingAfter>`

- **GIVEN** a change that validation reports `<readiness>` <!-- changeValidationReports -->
- **AND** `<pending>` phase(s) of its plan have unchecked tasks <!-- phasesWithUncheckedTasks -->
- **WHEN** the implementation of the change is started <!-- startImplementation -->
- **THEN** `<phasesBuilt>` phase(s) are built <!-- phasesBuilt -->
- **AND** `<pendingAfter>` phase(s) have unchecked tasks afterwards <!-- phasesPendingAfter -->

##### Examples:

  | readiness | pending | phasesBuilt | pendingAfter |
  | --------- | ------- | ----------- | ------------ |
  | ready     | 2       | 1           | 1            |
  | ready     | 1       | 1           | 0            |
  | ready     | 0       | 0           | 0            |

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
