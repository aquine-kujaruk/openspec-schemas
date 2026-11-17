# factory/quality/hold-stage Specification

## Purpose
Judging an agent's attempt to finish: with a change in implementation, the agent finishes only when the harness is as it was installed and generated and the change's checks pass. Repeated failure hands the change to the person instead of holding the agent for ever.

## Requirements

### Requirement: An agent finishes only when the change's checks pass

`@by:agent`

The gate SHALL run the checks of the current phase. After a pass the main agent SHALL be directed to the first outstanding task, or to verification when every task is complete. It SHALL be allowed to finish after verification succeeds for the current change and product state. A continuation SHALL clear the failure count. A recorded request awaiting the person or unresolved feedback SHALL allow the agent to yield. Repeated failing checks SHALL follow the existing three-attempt handoff.

#### Scenario Outline: finishing with checks that `<checks>` is `<verdict>`

- **GIVEN** a change in implementation whose checks `<checks>` <!-- changeChecks -->
- **AND** the change is at `<stage>` <!-- changeAtStage -->
- **AND** `<failures>` failed attempt(s) at finishing in a row before this one <!-- failedAttemptsBefore -->
- **WHEN** the `<agentKind>` agent is about to finish <!-- aboutToFinish -->
- **THEN** finishing is `<verdict>` <!-- finishVerdict -->
- **AND** the gate directs the agent to `<instruction>` <!-- gateDirectsTo -->
- **AND** `<failuresAfter>` failed attempt(s) in a row are counted <!-- failedAttemptsCounted -->

##### Examples:

  | checks | stage                             | failures | agentKind | verdict | instruction             | failuresAfter |
  | ------ | --------------------------------- | -------- | --------- | ------- | ----------------------- | ------------- |
  | pass   | task pending in phase one         | 0        | main      | refused | continue phase one      | 0             |
  | pass   | phase one done, phase two pending | 2        | main      | refused | start phase two         | 0             |
  | pass   | last phase done, evidence absent  | 0        | main      | refused | verify the change       | 0             |
  | pass   | last phase done, evidence stale   | 0        | main      | refused | verify the change       | 0             |
  | pass   | last phase done, verified         | 0        | main      | allowed | finish                  | 0             |
  | pass   | feedback awaiting a decision      | 0        | main      | allowed | yield                   | 0             |
  | fail   | task pending in phase one         | 0        | main      | refused | fix the reported check  | 1             |
  | fail   | task pending in phase one         | 1        | main      | refused | fix the reported check  | 2             |

### Requirement: The third failure in a row hands the change to the person

`@by:agent`

When the checks fail on the third attempt in a row, the gate SHALL let the agent finish and SHALL record the change as waiting for the person, with the findings of that attempt. On earlier failures the change SHALL stay with the agent.

#### Scenario Outline: after `<failures>` failure(s) the change waits for `<waitingFor>`

- **GIVEN** a change in implementation whose checks `<checks>` <!-- changeChecks -->
- **AND** `<failures>` failed attempt(s) at finishing in a row before this one <!-- failedAttemptsBefore -->
- **WHEN** the `<agentKind>` agent is about to finish <!-- aboutToFinish -->
- **THEN** finishing is `<verdict>` <!-- finishVerdict -->
- **AND** the change is waiting for `<waitingFor>` <!-- changeWaitingFor -->

##### Examples:

  | checks | failures | agentKind | verdict | waitingFor |
  | ------ | -------- | --------- | ------- | ---------- |
  | fail   | 0        | main      | refused | the agent  |
  | fail   | 1        | main      | refused | the agent  |
  | fail   | 2        | main      | allowed | the person |

### Requirement: A helper agent is held like the main one

`@by:agent`

The helper SHALL be judged by the same phase checks as the main agent. When its work passes it MAY finish while the main agent continues the change. Its pass SHALL preserve the main agent’s obligation to finish the plan.

#### Scenario Outline: the `<agentKind>` agent finishing with checks that `<checks>` is `<verdict>`

- **GIVEN** a change in implementation whose checks `<checks>` <!-- changeChecks -->
- **AND** `<failures>` failed attempt(s) at finishing in a row before this one <!-- failedAttemptsBefore -->
- **WHEN** the `<agentKind>` agent is about to finish <!-- aboutToFinish -->
- **THEN** finishing is `<verdict>` <!-- finishVerdict -->

##### Examples:

  | checks | failures | agentKind | verdict |
  | ------ | -------- | --------- | ------- |
  | fail   | 0        | helper    | refused |
  | pass   | 0        | helper    | allowed |

### Requirement: An altered harness holds the agent

`@by:agent`

With a change in implementation, the gate SHALL refuse an agent's attempt to finish when a part of the harness differs from what was installed or generated, naming that part, even when the checks pass.

#### Scenario Outline: finishing with `<part>` altered is `<verdict>`

- **GIVEN** a change in implementation whose checks `<checks>` <!-- changeChecks -->
- **AND** the harness part `<part>` was altered <!-- harnessPartAltered -->
- **WHEN** the `<agentKind>` agent is about to finish <!-- aboutToFinish -->
- **THEN** finishing is `<verdict>` <!-- finishVerdict -->
- **AND** the refusal names the harness part `<part>` <!-- refusalNamesHarnessPart -->

##### Examples:

  | checks | part                  | agentKind | verdict |
  | ------ | --------------------- | --------- | ------- |
  | pass   | generated tests       | main      | refused |
  | pass   | installed schemas     | main      | refused |
  | pass   | factory configuration | main      | refused |

### Requirement: With no change in implementation the gate holds nobody

`@by:agent`

When no change is in implementation, the gate SHALL allow an agent to finish.

#### Scenario Outline: finishing with `<changes>` change(s) in implementation is `<verdict>`

- **GIVEN** `<changes>` change(s) in implementation <!-- changesInImplementation -->
- **WHEN** the `<agentKind>` agent is about to finish <!-- aboutToFinish -->
- **THEN** finishing is `<verdict>` <!-- finishVerdict -->

##### Examples:

  | changes | agentKind | verdict |
  | ------- | --------- | ------- |
  | 0       | main      | allowed |
  | 0       | helper    | allowed |

### Requirement: A change is judged by the checks of its own schema

`@by:agent`

Only the workstreams of the change’s schema SHALL supply phase checks. For a schema with no workstreams, harness integrity and the main agent’s outstanding tasks and verification SHALL still govern completion.

#### Scenario Outline: a `<schema>` change finishing while the product's checks `<checks>` is `<verdict>`

- **GIVEN** a change in implementation made with the schema `<schema>` <!-- changeInImplementationWithSchema -->
- **AND** the checks of the product's workstreams `<checks>` <!-- productChecks -->
- **AND** the change is at `<stage>` <!-- changeAtStage -->
- **WHEN** the `<agentKind>` agent is about to finish <!-- aboutToFinish -->
- **THEN** finishing is `<verdict>` <!-- finishVerdict -->

##### Examples:

  | schema        | checks | agentKind | verdict | stage |
  | ------------- | ------ | --------- | ------- | ----- |
  | clean-backend | fail   | main      | refused | last phase done, verified |
  | spec-plan     | fail   | main      | allowed | last phase done, verified |
  | spec-plan     | pass   | main      | allowed | last phase done, verified |

### Requirement: A change is judged by its own product alone

`@by:agent`

The gate SHALL judge only the checks of the change’s own product. Once that change is verified, a failing check in another product SHALL allow the main agent to finish.

#### Scenario Outline: a change of `<product>` finishing while `<failing>` fails is `<verdict>`

- **GIVEN** the project declares the products `<products>` <!-- projectDeclaresProducts -->
- **AND** a change of the product `<product>` in implementation <!-- changeOfProductInImplementation -->
- **AND** the checks of the product `<failing>` fail <!-- productChecksFail -->
- **AND** the change is at `<stage>` <!-- changeAtStage -->
- **WHEN** the `<agentKind>` agent is about to finish <!-- aboutToFinish -->
- **THEN** finishing is `<verdict>` <!-- finishVerdict -->

##### Examples:

  | products    | product | failing | agentKind | verdict | stage |
  | ----------- | ------- | ------- | --------- | ------- | ----- |
  | api, worker | api     | api     | main      | refused | last phase done, verified |
  | api, worker | api     | worker  | main      | allowed | last phase done, verified |
