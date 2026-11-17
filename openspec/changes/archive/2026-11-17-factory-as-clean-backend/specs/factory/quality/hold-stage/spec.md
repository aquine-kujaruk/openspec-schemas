## Purpose

Judging an agent's attempt to finish: with a change in implementation, the agent finishes only when the harness is as it was installed and generated and the change's checks pass. Repeated failure hands the change to the person instead of holding the agent for ever.

## ADDED Requirements

### Requirement: An agent finishes only when the change's checks pass

`@by:agent`

With a change in implementation, the gate SHALL allow an agent to finish when the checks of the phase it is building pass, and SHALL refuse when they fail, returning the findings. A pass SHALL clear the count of failed attempts, and the pass of the agent that builds SHALL end the implementation it started.

#### Scenario Outline: finishing with checks that `<checks>` is `<verdict>`

- **GIVEN** a change in implementation whose checks `<checks>` <!-- changeChecks -->
- **AND** `<failures>` failed attempt(s) at finishing in a row before this one <!-- failedAttemptsBefore -->
- **WHEN** the `<agentKind>` agent is about to finish <!-- aboutToFinish -->
- **THEN** finishing is `<verdict>` <!-- finishVerdict -->
- **AND** `<failuresAfter>` failed attempt(s) in a row are counted <!-- failedAttemptsCounted -->

##### Examples:

  | checks | failures | agentKind | verdict | failuresAfter |
  | ------ | -------- | --------- | ------- | ------------- |
  | pass   | 0        | main      | allowed | 0             |
  | pass   | 2        | main      | allowed | 0             |
  | fail   | 0        | main      | refused | 1             |
  | fail   | 1        | main      | refused | 2             |

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

The gate SHALL judge a helper agent's attempt to finish by the same rule as the main agent's.

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

The gate SHALL judge a change in implementation by the checks of the workstreams its own schema has. A change whose schema has no workstreams SHALL be held only by an altered harness.

#### Scenario Outline: a `<schema>` change finishing while the product's checks `<checks>` is `<verdict>`

- **GIVEN** a change in implementation made with the schema `<schema>` <!-- changeInImplementationWithSchema -->
- **AND** the checks of the product's workstreams `<checks>` <!-- productChecks -->
- **WHEN** the `<agentKind>` agent is about to finish <!-- aboutToFinish -->
- **THEN** finishing is `<verdict>` <!-- finishVerdict -->

##### Examples:

  | schema        | checks | agentKind | verdict |
  | ------------- | ------ | --------- | ------- |
  | clean-backend | fail   | main      | refused |
  | spec-plan     | fail   | main      | allowed |
  | spec-plan     | pass   | main      | allowed |

### Requirement: A change is judged by its own product alone

`@by:agent`

In a project with products, the gate SHALL judge a change in implementation by the checks of its own product only, so that a failing check in another product SHALL NOT hold it.

#### Scenario Outline: a change of `<product>` finishing while `<failing>` fails is `<verdict>`

- **GIVEN** the project declares the products `<products>` <!-- projectDeclaresProducts -->
- **AND** a change of the product `<product>` in implementation <!-- changeOfProductInImplementation -->
- **AND** the checks of the product `<failing>` fail <!-- productChecksFail -->
- **WHEN** the `<agentKind>` agent is about to finish <!-- aboutToFinish -->
- **THEN** finishing is `<verdict>` <!-- finishVerdict -->

##### Examples:

  | products    | product | failing | agentKind | verdict |
  | ----------- | ------- | ------- | --------- | ------- |
  | api, worker | api     | api     | main      | refused |
  | api, worker | api     | worker  | main      | allowed |
