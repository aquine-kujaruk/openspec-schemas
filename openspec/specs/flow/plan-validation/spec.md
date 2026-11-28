# flow/plan-validation Specification

## Purpose

Validating a change: telling by rule, not by reading, whether its plan can be handed to the implementer and later to the archiver. A change is ready when no question is open, every durable block is tagged and its tag holds against the consolidated tree, and its tasks belong to the schema's workstreams.

## Requirements

### Requirement: A plan with an open question is not ready

Validation SHALL report a change as ready only when its plan lists no open question.

#### Scenario Outline: a plan listing `<open>` open question(s) is `<readiness>`

- **GIVEN** a change whose plan lists `<open>` open question(s) <!-- planListingOpenQuestions -->
- **WHEN** the change is validated <!-- validateChange -->
- **THEN** the change is reported `<readiness>` <!-- changeReportedAs -->

##### Examples:

  | open | readiness |
  | ---- | --------- |
  | 0    | ready     |
  | 1    | not ready |

### Requirement: Every durable block carries exactly one operation tag

Each architecture decision and each procedure in a plan SHALL carry exactly one of the operation tags `@adds`, `@modifies`, `@replaces`, `@renames`, `@removes`. Validation SHALL report the change as not ready, naming the block, when a block carries none or more than one.

#### Scenario Outline: the `<kind>` block `<slug>` with `<tagCount>` operation tag(s) makes the change `<readiness>`

- **GIVEN** a change whose plan has the `<kind>` block `<slug>` carrying `<tagCount>` operation tag(s) <!-- blockCarryingOperationTags -->
- **WHEN** the change is validated <!-- validateChange -->
- **THEN** the change is reported `<readiness>` <!-- changeReportedAs -->
- **AND** `<findings>` finding(s) name the block `<slug>` <!-- findingsNameBlock -->

##### Examples:

  | kind      | slug           | tagCount | readiness | findings |
  | --------- | -------------- | -------- | --------- | -------- |
  | decision  | money-in-cents | 1        | ready     | 0        |
  | decision  | money-in-cents | 0        | not ready | 1        |
  | decision  | money-in-cents | 2        | not ready | 1        |
  | procedure | prod-logs      | 0        | not ready | 1        |

### Requirement: An operation tag holds against the consolidated tree

A block tagged `@adds` SHALL name a slug the consolidated tree does not have. A block tagged `@modifies`, `@replaces`, `@renames` or `@removes` SHALL name a slug the consolidated tree has. Validation SHALL report the change as not ready when a tag does not hold.

#### Scenario Outline: `<tag>` on `<slug>` against the consolidated decisions `<consolidated>` is `<readiness>`

- **GIVEN** the consolidated decisions `<consolidated>` <!-- consolidatedDecisions -->
- **AND** a change whose plan has the decision block `<slug>` tagged `<tag>` <!-- decisionBlockTagged -->
- **WHEN** the change is validated <!-- validateChange -->
- **THEN** the change is reported `<readiness>` <!-- changeReportedAs -->

##### Examples:

  | consolidated   | slug             | tag                      | readiness |
  | -------------- | ---------------- | ------------------------ | --------- |
  | none           | money-in-cents   | @adds                    | ready     |
  | money-in-cents | money-in-cents   | @adds                    | not ready |
  | money-in-cents | money-as-decimal | @replaces:money-in-cents | ready     |
  | none           | money-as-decimal | @replaces:money-in-cents | not ready |
  | money-in-cents | money-in-cents   | @modifies:money-in-cents | ready     |
  | none           | no-router        | @removes:no-router       | not ready |

### Requirement: An operation on a standing block records the origin it saw

A block tagged `@modifies`, `@replaces`, `@renames` or `@removes` SHALL record, as its base, the origin the consolidated block it names carried when the plan was written. Validation SHALL report the change as not ready when the base is absent or is no longer the origin that block carries.

#### Scenario Outline: `<tag>` with base `<base>` on a block of origin `<origin>` is `<readiness>`

- **GIVEN** the consolidated decision `<slug>` of origin `<origin>` <!-- consolidatedDecisionOfOrigin -->
- **AND** a change whose plan has the decision block `<slug>` tagged `<tag>` with base `<base>` <!-- decisionBlockTaggedWithBase -->
- **WHEN** the change is validated <!-- validateChange -->
- **THEN** the change is reported `<readiness>` <!-- changeReportedAs -->

##### Examples:

  | slug           | origin                 | tag                      | base                 | readiness |
  | -------------- | ---------------------- | ------------------------ | -------------------- | --------- |
  | money-in-cents | 2026-11-01-add-money   | @modifies:money-in-cents | 2026-11-01-add-money | ready     |
  | money-in-cents | 2026-11-08-add-refunds | @modifies:money-in-cents | 2026-11-01-add-money | not ready |
  | money-in-cents | 2026-11-01-add-money   | @removes:money-in-cents  | none                 | not ready |

### Requirement: A decision says where it applies and what enforces it

Each architecture decision that adds, modifies, replaces or renames SHALL carry the tags `@area`, `@topic`, `@applies` and `@enforced`. Validation SHALL report the change as not ready, naming the missing tag, when one is absent.

#### Scenario Outline: a decision block lacking `<missing>` makes the change not ready

- **GIVEN** a change whose plan has the decision block `<slug>` lacking the tag `<missing>` <!-- decisionBlockLackingTag -->
- **WHEN** the change is validated <!-- validateChange -->
- **THEN** the change is reported `<readiness>` <!-- changeReportedAs -->
- **AND** the finding names the missing tag `<missing>` <!-- findingNamesMissingTag -->

##### Examples:

  | slug           | missing   | readiness |
  | -------------- | --------- | --------- |
  | money-in-cents | @applies  | not ready |
  | money-in-cents | @enforced | not ready |
  | money-in-cents | @area     | not ready |
  | money-in-cents | @topic    | not ready |

### Requirement: A procedure says its purpose and its environments

Each procedure that adds, modifies, replaces or renames SHALL carry the tags `@purpose`, `@topic` and `@env`. The purpose SHALL be one of `setup`, `access`, `diagnose`, `operate`. Validation SHALL report the change as not ready, naming the missing tag, when one is absent.

#### Scenario Outline: a procedure block lacking `<missing>` makes the change not ready

- **GIVEN** a change whose plan has the procedure block `<slug>` lacking the tag `<missing>` <!-- procedureBlockLackingTag -->
- **WHEN** the change is validated <!-- validateChange -->
- **THEN** the change is reported `<readiness>` <!-- changeReportedAs -->
- **AND** the finding names the missing tag `<missing>` <!-- findingNamesMissingTag -->

##### Examples:

  | slug      | missing  | readiness |
  | --------- | -------- | --------- |
  | prod-logs | @purpose | not ready |
  | prod-logs | @env     | not ready |
  | prod-logs | @topic   | not ready |

#### Scenario Outline: a procedure of purpose `<purpose>` makes the change `<readiness>`

- **GIVEN** a change whose plan has the procedure block `<slug>` of purpose `<purpose>` <!-- procedureBlockOfPurpose -->
- **WHEN** the change is validated <!-- validateChange -->
- **THEN** the change is reported `<readiness>` <!-- changeReportedAs -->

##### Examples:

  | slug      | purpose  | readiness |
  | --------- | -------- | --------- |
  | prod-logs | diagnose | ready     |
  | prod-logs | setup    | ready     |
  | prod-logs | misc     | not ready |

### Requirement: A procedure holds where a secret is kept, never the secret

A procedure SHALL name where a credential is kept and SHALL NOT contain a credential. Validation SHALL report the change as not ready, naming the procedure, when a step holds a value shaped like a credential.

#### Scenario Outline: a procedure step holding `<content>` makes the change `<readiness>`

- **GIVEN** a change whose plan has the procedure block `<slug>` with a step holding `<content>` <!-- procedureStepHolding -->
- **WHEN** the change is validated <!-- validateChange -->
- **THEN** the change is reported `<readiness>` <!-- changeReportedAs -->

##### Examples:

  | slug      | content                         | readiness |
  | --------- | ------------------------------- | --------- |
  | prod-logs | the name of the secret's store  | ready     |
  | prod-logs | a value shaped like an access key | not ready |

### Requirement: Every task belongs to one workstream of the schema

`@by:person`

Every checkbox in a plan is a task, and every task SHALL sit inside a phase. When the change's schema has workstreams, every task SHALL name one of them. When it has none, no task SHALL name a workstream. Validation SHALL report the change as not ready when a task sits outside a phase, names a workstream the schema does not have, or names none in a schema that has some.

#### Scenario Outline: a task naming `<workstream>` placed `<placement>` makes the change `<readiness>`

- **GIVEN** a change whose schema has the workstreams `<workstreams>` <!-- schemaWorkstreams -->
- **AND** its plan has a task naming the workstream `<workstream>` placed `<placement>` <!-- taskNamingWorkstreamPlaced -->
- **WHEN** the change is validated <!-- validateChange -->
- **THEN** the change is reported `<readiness>` <!-- changeReportedAs -->

##### Examples:

  | workstreams                                                | workstream | placement       | readiness |
  | ---------------------------------------------------------- | ---------- | --------------- | --------- |
  | app-domain, infrastructure, adapters, modules, controllers | app-domain | inside a phase  | ready     |
  | app-domain, infrastructure, adapters, modules, controllers | react-ui   | inside a phase  | not ready |
  | app-domain, infrastructure, adapters, modules, controllers | app-domain | outside a phase | not ready |
  | app-domain, infrastructure, adapters, modules, controllers | none       | inside a phase  | not ready |
  | none                                                       | none       | inside a phase  | ready     |
  | none                                                       | app-domain | inside a phase  | not ready |
  | none                                                       | none       | outside a phase | not ready |

### Requirement: A change without delta specs says so

A change SHALL either hold at least one delta spec or be marked as changing no behaviour, and never both. Validation SHALL report the change as not ready otherwise.

#### Scenario Outline: `<deltaSpecs>` delta spec(s) with the no-behaviour mark `<marked>` is `<readiness>`

- **GIVEN** a change holding `<deltaSpecs>` delta spec(s) whose no-behaviour mark is `<marked>` <!-- changeDeltaSpecsAndMark -->
- **WHEN** the change is validated <!-- validateChange -->
- **THEN** the change is reported `<readiness>` <!-- changeReportedAs -->

##### Examples:

  | deltaSpecs | marked | readiness |
  | ---------- | ------ | --------- |
  | 1          | absent | ready     |
  | 0          | set    | ready     |
  | 0          | absent | not ready |
  | 1          | set    | not ready |

### Requirement: A change names one declared product of its schema

In a project with products, validation SHALL report a change not ready when it names no product, names a product the project does not declare, or names a product whose schema is not the change's schema.

#### Scenario Outline: a `<schema>` change naming `<named>` is `<readiness>`

- **GIVEN** the project declares the products `<products>` <!-- projectDeclaresProducts -->
- **AND** a change made with the schema `<schema>` that names the product `<named>` <!-- changeNamesProduct -->
- **WHEN** the change is validated <!-- validateChange -->
- **THEN** the change is reported `<readiness>` <!-- changeReportedAs -->

##### Examples:

  | products                                                 | schema        | named     | readiness |
  | -------------------------------------------------------- | ------------- | --------- | --------- |
  | api with clean-backend, contracts with spec-plan         | clean-backend | api       | ready     |
  | api with clean-backend, contracts with spec-plan         | spec-plan     | contracts | ready     |
  | api with clean-backend, contracts with spec-plan         | spec-plan     | api       | not ready |
  | api with clean-backend, contracts with spec-plan         | clean-backend | web       | not ready |
  | api with clean-backend, contracts with spec-plan         | clean-backend | none      | not ready |

### Requirement: Linked changes name each other

A change MAY link the other changes of its intention. Validation SHALL report a change not ready when a change it links does not exist, active or archived, or does not link it back.

#### Scenario Outline: `<change>` linking `<linked>`, which links `<back>`, is `<readiness>`

- **GIVEN** the change `<change>` links the changes `<linked>` <!-- changeLinks -->
- **AND** the change `<linked>` links back the changes `<back>` <!-- linkedChangeLinksBack -->
- **WHEN** the change is validated <!-- validateChange -->
- **THEN** the change is reported `<readiness>` <!-- changeReportedAs -->

##### Examples:

  | change         | linked         | back           | readiness |
  | -------------- | -------------- | -------------- | --------- |
  | add-orders-api | add-orders-web | add-orders-api | ready     |
  | add-orders-api | add-orders-web | none           | not ready |
  | add-orders-api | missing-change | none           | not ready |

### Requirement: An access procedure records that it was probed

Each procedure of purpose `access` that adds, modifies, replaces or renames SHALL carry the tag `@probed`, valued with the date of the probe or with `declined` when the person declined the call. Validation SHALL report the change as not ready, naming the tag, when an access procedure lacks it or carries another value. A procedure of any other purpose SHALL NOT need it.

#### Scenario Outline: a procedure of purpose `<purpose>` probed `<probed>` makes the change `<readiness>`

- **GIVEN** a change whose plan has the procedure block `<slug>` of purpose `<purpose>` probed `<probed>` <!-- procedureBlockOfPurposeProbed -->
- **WHEN** the change is validated <!-- validateChange -->
- **THEN** the change is reported `<readiness>` <!-- changeReportedAs -->

##### Examples:

  | slug            | purpose  | probed     | readiness |
  | --------------- | -------- | ---------- | --------- |
  | invoices-access | access   | 2026-11-16 | ready     |
  | invoices-access | access   | declined   | ready     |
  | invoices-access | access   | none       | not ready |
  | invoices-access | access   | yesterday  | not ready |
  | prod-logs       | diagnose | none       | ready     |

### Requirement: Every screen a web change lists is approved

In a change whose schema declares a spike workstream, each block under `## Screens` SHALL carry the tag `@approved`, valued with the date it was approved or with `declined` when the person declined to see it, SHALL name the page the implementation will build (`@page`), and SHALL name its spike (`@spike`), an HTML file under the change's `spikes/` folder that exists. A plan with a task of the spike workstream SHALL list at least one screen. Validation SHALL report the change as not ready, naming the screen or the tag, otherwise. A change whose schema declares no spike workstream SHALL NOT be asked for screens.

#### Scenario Outline: a `<schema>` change with a screen approved `<approved>` and `<tasks>` spike task(s) is `<readiness>`

- **GIVEN** a change made with the schema `<schema>` <!-- changeWithSchema -->
- **AND** its plan has the screen `<screen>` approved `<approved>` <!-- planScreenApproved -->
- **AND** the screen's spike `<spike>` <!-- screenSpike -->
- **AND** its plan has `<tasks>` task(s) of the spike workstream <!-- planSpikeTasks -->
- **WHEN** the change is validated <!-- validateChange -->
- **THEN** the change is reported `<readiness>` <!-- changeReportedAs -->

##### Examples:

  | schema        | screen      | approved   | spike                   | tasks | readiness |
  | ------------- | ----------- | ---------- | ----------------------- | ----- | --------- |
  | clean-react   | orders-list | 2026-11-16 | exists                  | 1     | ready     |
  | clean-react   | orders-list | declined   | exists                  | 1     | ready     |
  | clean-react   | orders-list | none       | exists                  | 1     | not ready |
  | clean-react   | orders-list | yesterday  | exists                  | 1     | not ready |
  | clean-react   | orders-list | 2026-11-16 | is named but missing    | 1     | not ready |
  | clean-react   | orders-list | 2026-11-16 | is not named            | 1     | not ready |
  | clean-react   | orders-list | 2026-11-16 | lies outside the change | 1     | not ready |
  | clean-react   | no screen   | none       | is not named            | 1     | not ready |
  | clean-react   | no screen   | none       | is not named            | 0     | ready     |
  | clean-backend | no screen   | none       | is not named            | 0     | ready     |

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

### Requirement: A change is ready only once the person approved its plan

`@by:agent`

The plan SHALL record the person's approval as `approved_at` in its front matter, valued with the date of the approval. Validation SHALL report the change as not ready, naming the approval, while the plan records none or records a value that is not a date.

#### Scenario Outline: a plan approved `<approved>` makes the change `<readiness>`

- **GIVEN** a change whose plan is approved `<approved>` <!-- planApproved -->
- **WHEN** the change is validated <!-- validateChange -->
- **THEN** the change is reported `<readiness>` <!-- changeReportedAs -->

##### Examples:

  | approved   | readiness |
  | ---------- | --------- |
  | 2026-11-17 | ready     |
  | none       | not ready |
  | yesterday  | not ready |

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

#### Scenario Outline: a decision tagged `<basis>` judged at `<confidence>` is asked `<asked>` when its text `<text>`

- **GIVEN** the decision model key is `<key>` <!-- decisionModelKey -->
- **AND** an architecture decision `money-in-cents` tagged `@by:agent <basis>` whose basis the decision model holds at `<confidence>` <!-- agentDecisionJudgedAt -->
- **AND** the change validated once <!-- changeValidatedOnce -->
- **AND** the decision's text `<text>` <!-- decisionTextAfterJudgement -->
- **WHEN** the change is validated <!-- validateChange -->
- **THEN** the decision model was asked `<asked>` <!-- decisionModelAsked -->

##### Examples:

  | key        | basis          | confidence | text    | asked |
  | ---------- | -------------- | ---------- | ------- | ----- |
  | configured | @basis:no-fork | 0.95       | stays   | once  |
  | configured | @basis:no-fork | 0.95       | changes | twice |
