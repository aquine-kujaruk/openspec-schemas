# factory/change-control/authorize-write Specification

## Purpose
Judging a write before an agent makes it: product code may be written only while a change is in implementation, a change's own artifacts may be written while it is active, and the harness may never be written by an agent.

## Requirements

### Requirement: Product code is writable only while a change is in implementation

`@by:agent`

A change is in implementation from the moment the implement phase starts building one of its phases, which it does only for a ready change, until the checks of that phase let the agent finish. The guard SHALL refuse a write under a configured product root when no change is in implementation, and SHALL allow it when one is. A path outside the product roots and outside the harness SHALL be allowed.

#### Scenario Outline: writing `<path>` with `<changes>` change(s) in implementation is `<verdict>`

- **GIVEN** the product roots `<roots>` <!-- productRoots -->
- **AND** `<changes>` change(s) in implementation <!-- changesInImplementation -->
- **WHEN** an agent is about to write `<path>` <!-- aboutToWrite -->
- **THEN** the write is `<verdict>` <!-- writeVerdict -->

##### Examples:

  | roots                 | changes | path                                    | verdict |
  | --------------------- | ------- | --------------------------------------- | ------- |
  | src/*                 | 0       | src/orders/domain/order.entity.ts       | refused |
  | src/*                 | 1       | src/orders/domain/order.entity.ts       | allowed |
  | src/*, test/acceptance | 0      | test/acceptance/orders/orders.steps.ts  | refused |
  | src/*, test/acceptance | 1      | test/acceptance/orders/orders.steps.ts  | allowed |
  | src/*                 | 0       | README.md                               | allowed |

### Requirement: A refused write says how to proceed

`@by:agent`

When the guard refuses a write to product code, it SHALL name the phase through which the write becomes possible.

#### Scenario Outline: a refused write to `<path>` names the `<phase>` phase

- **GIVEN** the product roots `<roots>` <!-- productRoots -->
- **AND** `<changes>` change(s) in implementation <!-- changesInImplementation -->
- **WHEN** an agent is about to write `<path>` <!-- aboutToWrite -->
- **THEN** the refusal names the `<phase>` phase <!-- refusalNamesPhase -->

##### Examples:

  | roots | changes | path                              | phase |
  | ----- | ------- | --------------------------------- | ----- |
  | src/* | 0       | src/orders/domain/order.entity.ts | plan  |

### Requirement: An agent never writes the harness

`@by:agent`

The guard SHALL refuse a write to the harness whatever the state of the project, naming the part of the harness the path belongs to. The harness is the project's factory configuration, the generated tests, the installed schemas, the agents' installed skills and guards, the consolidated specs, decisions and procedures, the archived changes, and the installed command.

#### Scenario Outline: writing `<path>` is refused as `<part>`

- **GIVEN** the product roots `<roots>` <!-- productRoots -->
- **AND** `<changes>` change(s) in implementation <!-- changesInImplementation -->
- **WHEN** an agent is about to write `<path>` <!-- aboutToWrite -->
- **THEN** the write is `<verdict>` <!-- writeVerdict -->
- **AND** the refusal names the harness part `<part>` <!-- refusalNamesHarnessPart -->

##### Examples:

  | roots | changes | path                                                  | verdict | part                    |
  | ----- | ------- | ----------------------------------------------------- | ------- | ----------------------- |
  | src/* | 1       | factory.config.ts                                     | refused | factory configuration   |
  | src/* | 1       | test/acceptance/orders/list-orders.feature.test.ts    | refused | generated tests         |
  | src/* | 1       | openspec/schemas/clean-backend/schema.yaml            | refused | installed schemas       |
  | src/* | 1       | openspec/specs/orders/list-orders/spec.md             | refused | consolidated specs      |
  | src/* | 1       | openspec/adr/product/money.md                         | refused | consolidated decisions  |
  | src/* | 1       | openspec/runbooks/diagnose/logs.md                    | refused | consolidated procedures |
  | src/* | 1       | openspec/changes/archive/2026-11-13-add-orders/plan.md | refused | archived changes        |
  | src/* | 0       | .claude/settings.json                                 | refused | agent guards            |
  | src/* | 1       | .agents/skills/plan/SKILL.md                          | refused | agent skills            |
  | src/* | 1       | node_modules/factory/factory/main.js                  | refused | installed command       |

### Requirement: A write that touches several files is refused when any of them is

`@by:agent`

When one write touches several files, the guard SHALL judge each file by the rules above and SHALL refuse the whole write when it would refuse any of them.

#### Scenario Outline: one write touching `<paths>` is `<verdict>`

- **GIVEN** the product roots `<roots>` <!-- productRoots -->
- **AND** `<changes>` change(s) in implementation <!-- changesInImplementation -->
- **WHEN** an agent is about to write the files `<paths>` in one write <!-- aboutToWriteSeveral -->
- **THEN** the write is `<verdict>` <!-- writeVerdict -->

##### Examples:

  | roots | changes | paths                                                  | verdict |
  | ----- | ------- | ------------------------------------------------------ | ------- |
  | src/* | 1       | src/orders/domain/order.entity.ts, src/orders/index.ts | allowed |
  | src/* | 1       | src/orders/domain/order.entity.ts, factory.config.ts   | refused |
  | src/* | 0       | README.md, src/orders/domain/order.entity.ts           | refused |

### Requirement: A change's own artifacts are writable while it is active

`@by:agent`

The guard SHALL allow a write to the plan and the delta specs of a change that is active, whether or not it is in implementation.

#### Scenario Outline: writing `<path>` of the active change `<change>` is `<verdict>`

- **GIVEN** the active change `<change>` <!-- activeChange -->
- **AND** `<changes>` change(s) in implementation <!-- changesInImplementation -->
- **WHEN** an agent is about to write `<path>` <!-- aboutToWrite -->
- **THEN** the write is `<verdict>` <!-- writeVerdict -->

##### Examples:

  | change     | changes | path                                                      | verdict |
  | ---------- | ------- | --------------------------------------------------------- | ------- |
  | add-orders | 0       | openspec/changes/add-orders/plan.md                       | allowed |
  | add-orders | 0       | openspec/changes/add-orders/specs/orders/list-orders/spec.md | allowed |
  | add-orders | 1       | openspec/changes/add-orders/plan.md                       | allowed |

### Requirement: Product code opens only to a change whose schema builds it

`@by:agent`

A product path SHALL be writable only while a change is in implementation whose schema has workstreams. A change in implementation whose schema has none SHALL open no product path.

#### Scenario Outline: with a `<schema>` change in implementation, writing `<path>` is `<verdict>`

- **GIVEN** the product roots `<roots>` <!-- productRoots -->
- **AND** a change in implementation made with the schema `<schema>` <!-- changeInImplementationWithSchema -->
- **WHEN** an agent is about to write `<path>` <!-- aboutToWrite -->
- **THEN** the write is `<verdict>` <!-- writeVerdict -->

##### Examples:

  | roots | schema        | path                              | verdict |
  | ----- | ------------- | --------------------------------- | ------- |
  | src/* | clean-backend | src/orders/domain/order.entity.ts | allowed |
  | src/* | spec-plan     | src/orders/domain/order.entity.ts | refused |
  | src/* | spec-plan     | docs/outage.md                    | allowed |

### Requirement: A product's folder opens only to that product's change

`@by:agent`

In a project with products, a path inside a product's folder SHALL be writable only while a change of that product is in implementation, whatever that product's schema. A change in implementation SHALL open no other product's folder.

#### Scenario Outline: with a change of `<changeProduct>` in implementation, writing `<path>` is `<verdict>`

- **GIVEN** the project declares the products `<products>` <!-- projectDeclaresProducts -->
- **AND** a change of the product `<changeProduct>` in implementation <!-- changeOfProductInImplementation -->
- **WHEN** an agent is about to write `<path>` <!-- aboutToWrite -->
- **THEN** the write is `<verdict>` <!-- writeVerdict -->

##### Examples:

  | products                                                                       | changeProduct | path                                          | verdict |
  | ------------------------------------------------------------------------------ | ------------- | --------------------------------------------- | ------- |
  | api at apps/api, worker at apps/worker                                         | api           | apps/api/src/orders/domain/order.entity.ts    | allowed |
  | api at apps/api, worker at apps/worker                                         | api           | apps/worker/src/billing/domain/charge.entity.ts | refused |
  | api at apps/api, contracts at packages/contracts with the schema spec-plan     | contracts     | packages/contracts/src/orders.ts              | allowed |
  | api at apps/api, contracts at packages/contracts with the schema spec-plan     | contracts     | apps/api/src/orders/domain/order.entity.ts    | refused |

### Requirement: A write the policy already resolved reads no work order

`@by:person`

When the write policy resolves a path as harness or as outside every product, the guard SHALL decide without reading the work orders in implementation; it SHALL read them only for a path that belongs to a product.

#### Scenario Outline: a write to `<path>` reads the work orders `<reads>` time(s)

- **GIVEN** the product roots `<roots>` <!-- productRoots -->
- **AND** `<changes>` change(s) in implementation <!-- changesInImplementation -->
- **WHEN** an agent is about to write `<path>` <!-- aboutToWrite -->
- **THEN** the write is `<verdict>` <!-- writeVerdict -->
- **AND** the work orders are read `<reads>` time(s) <!-- workOrdersRead -->

##### Examples:

  | roots  | changes | path                              | verdict | reads |
  | ------ | ------- | --------------------------------- | ------- | ----- |
  | src/*  | 1       | openspec/specs/a.md               | refused | 0     |
  | src/*  | 1       | README.md                         | allowed | 0     |
  | src/*  | 1       | src/orders/domain/order.entity.ts | allowed | 1     |
