# flow/plan Specification

## Purpose

Planning a change: an intention becomes a change through a first proposal written from the agent's own decisions and then one update per answer, with each decision written to the artifact its scope picks. The artifacts are the handoff; nothing is planned outside them.

## Requirements

### Requirement: An intention that changes something becomes a change

When the person states an intention that would change the product's behaviour, its code, its decisions or its procedures, the plan phase SHALL open a change for it. An intention that changes nothing SHALL open none.

#### Scenario Outline: an intention of kind `<kind>` leaves `<activeAfter>` active change(s)

- **GIVEN** a project with `<activeBefore>` active change(s) <!-- activeChangesBefore -->
- **WHEN** the person states an intention of kind `<kind>` <!-- stateIntention -->
- **THEN** the project has `<activeAfter>` active change(s) <!-- activeChangesAfter -->

##### Examples:

  | activeBefore | kind                      | activeAfter |
  | ------------ | ------------------------- | ----------- |
  | 0            | new behaviour             | 1           |
  | 0            | incident to diagnose      | 1           |
  | 0            | question about the system | 0           |
  | 1            | new behaviour             | 2           |

### Requirement: The first proposal is written before the person is asked anything

The plan phase SHALL write the change's first proposal from its own decisions before asking the person a question. Each decision only the person can take SHALL be listed in the plan as an open question.

#### Scenario Outline: a first proposal with `<open>` decision(s) for the person asks `<asked>` question(s) before it is written

- **GIVEN** an intention with `<open>` decision(s) only the person can take <!-- intentionWithOpenDecisions -->
- **WHEN** the plan phase writes the first proposal <!-- writeFirstProposal -->
- **THEN** the plan lists `<open>` open question(s) <!-- planListsOpenQuestions -->
- **AND** the person was asked `<asked>` question(s) before the proposal existed <!-- questionsAskedBeforeProposal -->

##### Examples:

  | open | asked |
  | ---- | ----- |
  | 2    | 0     |
  | 0    | 0     |

### Requirement: Each answer updates the artifacts at once

When the person answers open questions, the plan phase SHALL record each answered decision in the artifacts in that same update and SHALL remove its question from the plan.

#### Scenario Outline: answering `<answered>` of `<openBefore>` leaves `<open>` open

- **GIVEN** a change whose plan lists `<openBefore>` open question(s) <!-- planWithOpenQuestions -->
- **WHEN** the person answers `<answered>` of them <!-- answerQuestions -->
- **THEN** the plan lists `<open>` open question(s) <!-- planListsOpenQuestions -->
- **AND** `<recorded>` answered decision(s) are recorded in the artifacts <!-- answeredDecisionsRecorded -->

##### Examples:

  | openBefore | answered | open | recorded |
  | ---------- | -------- | ---- | -------- |
  | 2          | 1        | 1    | 1        |
  | 2          | 2        | 0    | 2        |

### Requirement: A decision is written to the artifact its scope picks

The plan phase SHALL write a decision to the delta specs when a user of the product notices it, to the plan's architecture decisions when a future change must respect it, to the plan's procedures when it says how the system is run or diagnosed, and to the plan's decisions when it matters only to this change. A decision that would hold in any project SHALL be left out of the change and reported as a proposal for the schema's own repository.

#### Scenario Outline: a `<scope>` decision is written to `<destination>`

- **GIVEN** a change being planned <!-- changeBeingPlanned -->
- **WHEN** the plan phase records a decision of scope `<scope>` <!-- recordDecisionOfScope -->
- **THEN** the decision is written to `<destination>` <!-- decisionWrittenTo -->

##### Examples:

  | scope                | destination                       |
  | -------------------- | --------------------------------- |
  | user-visible         | the delta specs                   |
  | binds future changes | the plan's architecture decisions |
  | operational          | the plan's procedures             |
  | change-local         | the plan's decisions              |
  | any project          | outside the change                |

### Requirement: What a change does to a standing decision or procedure is tagged while planning

While planning, the plan phase SHALL read the consolidated decisions and procedures and SHALL tag each durable block of the plan with what the change does to them: adding a new one, modifying, replacing, renaming or removing an existing one. The tag of an operation on an existing block SHALL name that block.

#### Scenario Outline: an intention that `<effect>` the `<kind>` `<slug>` yields a block tagged `<tag>`

- **GIVEN** the consolidated `<kind>` `<slug>` <!-- consolidatedBlock -->
- **AND** an intention that `<effect>` it <!-- intentionWithEffectOn -->
- **WHEN** the plan phase writes the first proposal <!-- writeFirstProposal -->
- **THEN** the plan carries a `<kind>` block tagged `<tag>` <!-- planBlockTagged -->

##### Examples:

  | kind      | slug           | effect         | tag                      |
  | --------- | -------------- | -------------- | ------------------------ |
  | decision  | money-in-cents | refines        | @modifies:money-in-cents |
  | decision  | money-in-cents | contradicts    | @replaces:money-in-cents |
  | decision  | no-router      | makes obsolete | @removes:no-router       |
  | procedure | prod-logs      | renames        | @renames:prod-logs       |

### Requirement: The schema's question policy decides what reaches the person

The plan phase SHALL list a decision as an open question when the schema's question policy reserves it for the person, and SHALL decide it alone otherwise, recording the alternative it discarded. Under the policy `ask-on-commitment`, the person is asked about behaviour the consolidated specs do not settle, about every decision that binds future changes, and about replacing or removing a standing decision.

#### Scenario Outline: under `<policy>` a `<decisionClass>` decision is listed as `<listedAs>`

- **GIVEN** a schema whose question policy is `<policy>` <!-- schemaQuestionPolicy -->
- **AND** an intention needing a decision of class `<decisionClass>` <!-- intentionNeedingDecision -->
- **WHEN** the plan phase writes the first proposal <!-- writeFirstProposal -->
- **THEN** the plan lists that decision as `<listedAs>` <!-- planListsDecisionAs -->

##### Examples:

  | policy            | decisionClass                              | listedAs      |
  | ----------------- | ------------------------------------------ | ------------- |
  | ask-on-commitment | change-local                               | decided       |
  | ask-on-commitment | behaviour the consolidated specs settle    | decided       |
  | ask-on-commitment | behaviour the consolidated specs leave open | open question |
  | ask-on-commitment | binds future changes                       | open question |
  | ask-on-commitment | replaces a standing decision               | open question |

### Requirement: A change always has a plan and has specs only when behaviour changes

Every change the plan phase opens SHALL have a plan. It SHALL have delta specs only when the intention changes behaviour a user notices; otherwise the change SHALL be marked as changing no behaviour.

#### Scenario Outline: an intention of kind `<kind>` yields `<plans>` plan and `<deltaSpecs>` delta spec(s)

- **GIVEN** an intention of kind `<kind>` covering `<useCases>` use case(s) <!-- intentionCoveringUseCases -->
- **WHEN** the plan phase writes the first proposal <!-- writeFirstProposal -->
- **THEN** the change has `<plans>` plan and `<deltaSpecs>` delta spec(s) <!-- changeHasArtifacts -->
- **AND** the change is marked as changing no behaviour: `<markedNoBehaviour>` <!-- changeMarkedNoBehaviour -->

##### Examples:

  | kind                 | useCases | plans | deltaSpecs | markedNoBehaviour |
  | -------------------- | -------- | ----- | ---------- | ----------------- |
  | new behaviour        | 1        | 1     | 1          | no                |
  | new behaviour        | 2        | 1     | 2          | no                |
  | incident to diagnose | 0        | 1     | 0          | yes               |

### Requirement: A change is opened with the schema its intention calls for

The plan phase SHALL open each change with one of the schemas the project has: the one whose stated use covers the intention. When an intention needs more than one schema, the plan phase SHALL open one change per schema, and each plan SHALL name the other changes. When no schema of the project covers the intention, the plan phase SHALL open no change and SHALL tell the person which schemas the project has.

#### Scenario Outline: an intention to `<intention>` opens changes with the schemas `<opened>`

- **GIVEN** a project with the schemas `<schemas>` <!-- projectSchemas -->
- **WHEN** the person states an intention to `<intention>` <!-- stateIntentionTo -->
- **THEN** the changes opened use the schemas `<opened>` <!-- openedChangesUse -->

##### Examples:

  | schemas                                 | intention                                              | opened                        |
  | --------------------------------------- | ------------------------------------------------------ | ----------------------------- |
  | spec-plan, clean-backend                | add a behaviour to the service                         | clean-backend                 |
  | spec-plan, clean-backend                | record how to diagnose an outage                       | spec-plan                     |
  | spec-plan, clean-backend, clean-frontend | add a behaviour to the service and to the application | clean-backend, clean-frontend |
  | legacy-to-specs                         | add a behaviour to the service                         | none                          |
