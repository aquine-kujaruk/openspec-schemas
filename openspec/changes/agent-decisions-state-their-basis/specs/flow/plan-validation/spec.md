## MODIFIED Requirements

### Requirement: Every decision names who took it

`@by:person`

Each line under the plan's Decisions, each architecture decision, procedure and screen of the plan, and each requirement a delta spec of the change adds or modifies SHALL carry exactly one of `@by:person` and `@by:agent`; a requirement carries it as the first line of its text. Validation SHALL report the change as not ready, naming the decision, while one carries neither, both, or another value.

#### Scenario Outline: a `<kind>` tagged `<by>` makes the change `<readiness>`

- **GIVEN** a change whose `<kind>` `<name>` is tagged `<by>` <!-- decisionOfKindTaggedBy -->
- **WHEN** the change is validated <!-- validateChange -->
- **THEN** the change is reported `<readiness>` <!-- changeReportedAs -->

##### Examples:

  | kind                  | name              | by                    | readiness |
  | --------------------- | ----------------- | --------------------- | --------- |
  | line under Decisions  | money-in-cents    | @by:person            | ready     |
  | line under Decisions  | money-in-cents    | @by:agent             | ready     |
  | line under Decisions  | money-in-cents    | none                  | not ready |
  | line under Decisions  | money-in-cents    | @by:person @by:agent  | not ready |
  | line under Decisions  | money-in-cents    | @by:someone           | not ready |
  | architecture decision | money-in-cents    | @by:person            | ready     |
  | architecture decision | money-in-cents    | none                  | not ready |
  | procedure             | prod-logs         | @by:agent             | ready     |
  | procedure             | prod-logs         | none                  | not ready |
  | screen                | orders-list       | @by:person            | ready     |
  | screen                | orders-list       | none                  | not ready |
  | added requirement     | Orders are listed | @by:agent             | ready     |
  | added requirement     | Orders are listed | none                  | not ready |
  | modified requirement  | Orders are listed | @by:person            | ready     |
  | modified requirement  | Orders are listed | none                  | not ready |

## ADDED Requirements

### Requirement: An architecture decision the agent took states its basis

`@by:person`

An architecture decision tagged `@by:agent` SHALL carry exactly one `@basis`: `@basis:precedent:<slug>` when a consolidated decision, named by its slug, already settled the same kind of choice, or `@basis:no-fork` when no option it weighs changes what the product can do or for whom. Validation SHALL report the change as not ready, naming the decision, while one carries no basis, several, another value, or a precedent that names no consolidated decision. An architecture decision tagged `@by:person` SHALL NOT need a basis.

#### Scenario Outline: an architecture decision tagged `<tags>` against the consolidated decisions `<consolidated>` is `<readiness>`

- **GIVEN** the consolidated decisions `<consolidated>` <!-- consolidatedDecisions -->
- **AND** an architecture decision `money-in-cents` tagged `<tags>` <!-- architectureDecisionTagged -->
- **WHEN** the change is validated <!-- validateChange -->
- **THEN** the change is reported `<readiness>` <!-- changeReportedAs -->

##### Examples:

  | tags                                                | consolidated | readiness |
  | --------------------------------------------------- | ------------ | --------- |
  | @by:person                                          | none         | ready     |
  | @by:agent                                           | none         | not ready |
  | @by:agent @basis:no-fork                            | none         | ready     |
  | @by:agent @basis:precedent:rounding                 | rounding     | ready     |
  | @by:agent @basis:precedent:rounding                 | none         | not ready |
  | @by:agent @basis:hunch                              | none         | not ready |
  | @by:agent @basis:no-fork @basis:precedent:rounding  | rounding     | not ready |

### Requirement: The decision model judges the basis of an agent's architecture decision

`@by:person`

When the project configures the key of its decision model, validation SHALL ask that model, for each architecture decision tagged `@by:agent`, whether its basis holds: for `@basis:no-fork`, that no option the decision weighs changes what the product can do or for whom (where the data lives, local or online, on which devices or for how many people, which outside services it needs, what it costs); for `@basis:precedent:<slug>`, that the consolidated decision it names settles the same kind of choice. Each answer SHALL be recorded in the change with the model that gave it and the text it judged, and the same text SHALL NOT be asked again. Validation SHALL report the change as not ready, naming the decision and telling the agent to ask the person, while the model is less than 90 % sure the basis holds, or while it could not be asked. Without the key, validation SHALL NOT ask it.

#### Scenario Outline: a decision tagged `<basis>` with the key `<key>` and a model sure at `<confidence>` is `<readiness>`

- **GIVEN** the decision model key is `<key>` <!-- decisionModelKey -->
- **AND** an architecture decision `money-in-cents` tagged `@by:agent <basis>` whose basis the decision model holds at `<confidence>` <!-- agentDecisionJudgedAt -->
- **WHEN** the change is validated <!-- validateChange -->
- **THEN** the change is reported `<readiness>` <!-- changeReportedAs -->

##### Examples:

  | basis                      | key        | confidence  | readiness |
  | -------------------------- | ---------- | ----------- | --------- |
  | @basis:no-fork             | configured | 0.95        | ready     |
  | @basis:no-fork             | configured | 0.60        | not ready |
  | @basis:no-fork             | configured | unreachable | not ready |
  | @basis:no-fork             | absent     | unreachable | ready     |
  | @basis:precedent:rounding  | configured | 0.92        | ready     |
  | @basis:precedent:rounding  | configured | 0.40        | not ready |

#### Scenario Outline: a decision judged once is asked again `<asked>` when its text `<text>`

- **GIVEN** the decision model key is `configured` <!-- decisionModelKey -->
- **AND** an architecture decision `money-in-cents` tagged `@by:agent @basis:no-fork` whose basis the decision model holds at `0.95` <!-- agentDecisionJudgedAt -->
- **AND** the change validated once <!-- changeValidatedOnce -->
- **AND** the decision's text `<text>` <!-- decisionTextAfterJudgement -->
- **WHEN** the change is validated <!-- validateChange -->
- **THEN** the decision model was asked `<asked>` <!-- decisionModelAsked -->

##### Examples:

  | text    | asked |
  | ------- | ----- |
  | stays   | once  |
  | changes | twice |
