## MODIFIED Requirements

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

