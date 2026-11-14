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

Every checkbox in a plan is a task, and every task SHALL sit inside a phase and name one workstream of the change's schema. Validation SHALL report the change as not ready when a task names a workstream the schema does not have or sits outside a phase.

#### Scenario Outline: a task naming `<workstream>` placed `<placement>` makes the change `<readiness>`

- **GIVEN** a change whose schema has the workstreams `<workstreams>` <!-- schemaWorkstreams -->
- **AND** its plan has a task naming the workstream `<workstream>` placed `<placement>` <!-- taskNamingWorkstreamPlaced -->
- **WHEN** the change is validated <!-- validateChange -->
- **THEN** the change is reported `<readiness>` <!-- changeReportedAs -->

##### Examples:

  | workstreams                                                         | workstream | placement       | readiness |
  | ------------------------------------------------------------------- | ---------- | --------------- | --------- |
  | app-domain, infrastructure, adapters, clean-architecture, integrate | app-domain | inside a phase  | ready     |
  | app-domain, infrastructure, adapters, clean-architecture, integrate | react-ui   | inside a phase  | not ready |
  | app-domain, infrastructure, adapters, clean-architecture, integrate | app-domain | outside a phase | not ready |

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
