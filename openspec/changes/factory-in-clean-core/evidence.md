---
change: factory-in-clean-core
verdict: verified
digest: 7edd0ab7150030bf22902a9e103e352d8f0ec037b292aca471b8597f90f6c09a
---

# Evidence of factory-in-clean-core

## Scenarios

| Use case | Requirement | Scenario | Result |
| --- | --- | --- | --- |
| flow/verify | Evidence matches every scenario to what proves it | `3` of `3` scenario(s) passing makes the change `verified` | passed |
| flow/verify | Evidence matches every scenario to what proves it | `2` of `3` scenario(s) passing makes the change `not verified` | passed |
| flow/verify | Evidence matches every scenario to what proves it | `0` of `0` scenario(s) passing makes the change `verified` | passed |
| flow/verify | A failing check is feedback, never a fix | `infrastructure` failing its check raises feedback and changes `0` product file(s) | passed |
| flow/verify | A failing check is feedback, never a fix | `modules` failing its check raises feedback and changes `0` product file(s) | passed |
| flow/verify | The rubric review runs only where its key is configured | with the review key `configured` the review is `run` and the change is `verified` | passed |
| flow/verify | The rubric review runs only where its key is configured | with the review key `absent` the review is `skipped` and the change is `verified` | passed |
| flow/verify | A review warning is recorded and fails nothing | `2` review warning(s) leave the change `verified` | passed |
| flow/verify | A review warning is recorded and fails nothing | `0` review warning(s) leave the change `verified` | passed |
| flow/verify | A procedure is exercised only in the environments where that is safe | a procedure tagged for `local` is recorded as `executed` | passed |
| flow/verify | A procedure is exercised only in the environments where that is safe | a procedure tagged for `sandbox` is recorded as `executed` | passed |
| flow/verify | A procedure is exercised only in the environments where that is safe | a procedure tagged for `prod` is recorded as `reviewed only` | passed |
| flow/verify | A procedure is exercised only in the environments where that is safe | a procedure in `sandbox` probed `declined` with outcome `none` is recorded as `declined` and the change is `verified` | passed |
| flow/verify | A procedure is exercised only in the environments where that is safe | a procedure in `sandbox` probed `declined` with outcome `passed` is recorded as `executed` and the change is `verified` | passed |
| flow/verify | A procedure is exercised only in the environments where that is safe | a procedure in `sandbox` probed `2026-11-16` with outcome `none` is recorded as `not executed` and the change is `not verified` | passed |
| flow/verify | A scenario is matched to the test generated from its spec, where generation writes it | verifying in `a project`, the scenarios of `orders/get-order` are read from `test/acceptance/orders/get-order.feature.test.ts` | passed |
| flow/verify | A scenario is matched to the test generated from its spec, where generation writes it | verifying in `the command's repository`, the scenarios of `flow/verify` are read from `factory/flow/verify.feature.test.ts` | passed |
| flow/verify | A spec no test is generated from is proved by the person's word | in `the command's repository`, `flow/plan` with `0` generated test(s) and the person's word `none` is `unproved` | passed |
| flow/verify | A spec no test is generated from is proved by the person's word | in `the command's repository`, `flow/plan` with `0` generated test(s) and the person's word `proved` is `proved by the person's word` | passed |
| flow/verify | A spec no test is generated from is proved by the person's word | in `a project`, `orders/get-order` with `0` generated test(s) and the person's word `proved` is `unproved` | passed |
| flow/verify | Verify proves the product works as a whole | on a `web` product, `nothing fails` makes the change `verified`, feedback on `nothing` | passed |
| flow/verify | Verify proves the product works as a whole | on a `web` product, `no-unused-files names src/orders/framework/ui/orders-list/old-row.component.tsx` makes the change `not verified`, feedback on `react-ui` | passed |
| flow/verify | Verify proves the product works as a whole | on a `web` product, `duplication-below-threshold names src/orders/domain/entities/order.entity.ts` makes the change `not verified`, feedback on `app-domain` | passed |
| flow/verify | Verify proves the product works as a whole | on a `web` product, `the end-to-end test cancel-order fails` makes the change `not verified`, feedback on `the change` | passed |
| flow/verify | Verify proves the product works as a whole | on a `node` product, `no-unused-files names src/orders/infrastructure/acl/order.acl.ts` makes the change `not verified`, feedback on `infrastructure` | passed |
| flow/verify | Verify proves the product works as a whole | on a `node` product, `nothing fails, and it has no end-to-end tests` makes the change `verified`, feedback on `nothing` | passed |
| flow/verify | Verify proves the product works as a whole | the end-to-end test `cancel-order` `passes` is recorded `passed` | passed |
| flow/verify | Verify proves the product works as a whole | the end-to-end test `cancel-order` `fails` is recorded `failed` | passed |
| package/write-guard | Product code is writable only while a change is in implementation | writing `src/orders/domain/order.entity.ts` with `0` change(s) in implementation is `refused` | passed |
| package/write-guard | Product code is writable only while a change is in implementation | writing `src/orders/domain/order.entity.ts` with `1` change(s) in implementation is `allowed` | passed |
| package/write-guard | Product code is writable only while a change is in implementation | writing `test/acceptance/orders/orders.steps.ts` with `0` change(s) in implementation is `refused` | passed |
| package/write-guard | Product code is writable only while a change is in implementation | writing `test/acceptance/orders/orders.steps.ts` with `1` change(s) in implementation is `allowed` | passed |
| package/write-guard | Product code is writable only while a change is in implementation | writing `README.md` with `0` change(s) in implementation is `allowed` | passed |
| package/write-guard | A refused write says how to proceed | a refused write to `src/orders/domain/order.entity.ts` names the `plan` phase | passed |
| package/write-guard | An agent never writes the harness | writing `factory.config.ts` is refused as `factory configuration` | passed |
| package/write-guard | An agent never writes the harness | writing `test/acceptance/orders/list-orders.feature.test.ts` is refused as `generated tests` | passed |
| package/write-guard | An agent never writes the harness | writing `openspec/schemas/clean-backend/schema.yaml` is refused as `installed schemas` | passed |
| package/write-guard | An agent never writes the harness | writing `openspec/specs/orders/list-orders/spec.md` is refused as `consolidated specs` | passed |
| package/write-guard | An agent never writes the harness | writing `openspec/adr/product/money.md` is refused as `consolidated decisions` | passed |
| package/write-guard | An agent never writes the harness | writing `openspec/runbooks/diagnose/logs.md` is refused as `consolidated procedures` | passed |
| package/write-guard | An agent never writes the harness | writing `openspec/changes/archive/2026-11-13-add-orders/plan.md` is refused as `archived changes` | passed |
| package/write-guard | An agent never writes the harness | writing `.claude/settings.json` is refused as `agent guards` | passed |
| package/write-guard | An agent never writes the harness | writing `.agents/skills/plan/SKILL.md` is refused as `agent skills` | passed |
| package/write-guard | An agent never writes the harness | writing `node_modules/factory/factory/main.js` is refused as `installed command` | passed |
| package/write-guard | A write that touches several files is refused when any of them is | one write touching `src/orders/domain/order.entity.ts, src/orders/index.ts` is `allowed` | passed |
| package/write-guard | A write that touches several files is refused when any of them is | one write touching `src/orders/domain/order.entity.ts, factory.config.ts` is `refused` | passed |
| package/write-guard | A write that touches several files is refused when any of them is | one write touching `README.md, src/orders/domain/order.entity.ts` is `refused` | passed |
| package/write-guard | A change's own artifacts are writable while it is active | writing `openspec/changes/add-orders/plan.md` of the active change `add-orders` is `allowed` | passed |
| package/write-guard | A change's own artifacts are writable while it is active | writing `openspec/changes/add-orders/specs/orders/list-orders/spec.md` of the active change `add-orders` is `allowed` | passed |
| package/write-guard | A change's own artifacts are writable while it is active | writing `openspec/changes/add-orders/plan.md` of the active change `add-orders` is `allowed` #2 | passed |
| package/write-guard | Product code opens only to a change whose schema builds it | with a `clean-backend` change in implementation, writing `src/orders/domain/order.entity.ts` is `allowed` | passed |
| package/write-guard | Product code opens only to a change whose schema builds it | with a `spec-plan` change in implementation, writing `src/orders/domain/order.entity.ts` is `refused` | passed |
| package/write-guard | Product code opens only to a change whose schema builds it | with a `spec-plan` change in implementation, writing `docs/outage.md` is `allowed` | passed |
| package/write-guard | A product's folder opens only to that product's change | with a change of `api` in implementation, writing `apps/api/src/orders/domain/order.entity.ts` is `allowed` | passed |
| package/write-guard | A product's folder opens only to that product's change | with a change of `api` in implementation, writing `apps/worker/src/billing/domain/charge.entity.ts` is `refused` | passed |
| package/write-guard | A product's folder opens only to that product's change | with a change of `contracts` in implementation, writing `packages/contracts/src/orders.ts` is `allowed` | passed |
| package/write-guard | A product's folder opens only to that product's change | with a change of `contracts` in implementation, writing `apps/api/src/orders/domain/order.entity.ts` is `refused` | passed |
| repository/build | A package carries the schemas its manifest lists | the built `backend` holds the schema `clean-backend` as `present` | passed |
| repository/build | A package carries the schemas its manifest lists | the built `backend` holds the schema `legacy-to-specs` as `absent` | passed |
| repository/build | A package carries the schemas its manifest lists | the built `both` holds the schema `legacy-to-specs` as `present` | passed |
| repository/build | A schema definition names resources that exist | a definition naming the missing `workstream` `billing` stops the build | passed |
| repository/build | A schema definition names resources that exist | a definition naming the missing `validator` `strictest` stops the build | passed |
| repository/build | A schema definition names resources that exist | a definition naming the missing `question policy` `never-ask` stops the build | passed |
| repository/build | A schema definition names resources that exist | a definition naming the missing `core` `onion` stops the build | passed |
| repository/build | A variant differs only in what it overrides | `clean-backend-strict` overrides the `validator` of `clean-backend` and keeps its `question policy` | passed |
| repository/build | A variant differs only in what it overrides | `clean-backend-quiet` overrides the `question policy` of `clean-backend` and keeps its `validator` | passed |
| repository/build | A built package is known to be fresh or stale | `backend` is reported `fresh` when `schemas/clean-backend/workstreams/app-domain/SKILL.md` is `unchanged` | passed |
| repository/build | A built package is known to be fresh or stale | `backend` is reported `stale` when `schemas/clean-backend/workstreams/app-domain/SKILL.md` is `edited` | passed |
| repository/build | A built package is known to be fresh or stale | `backend` is reported `stale` when `schemas/spec-plan/questions/ask-on-commitment.md` is `edited` | passed |
| repository/build | A built package is known to be fresh or stale | `backend` is reported `stale` when `schemas/shared/phases/plan/SKILL.md` is `edited` | passed |
| repository/build | A built package pins every tool it runs | the built `backend` runs `specification tool` at exactly `2.0.0` | passed |
| repository/build | A built package pins every tool it runs | the built `backend` runs `linter` at exactly `1.93.0` | passed |
| repository/build | A resource is held where the definitions naming it put it | the `validator` `standard` held in `spec-plan` is accepted when `clean-backend extends spec-plan` | passed |
| repository/build | A resource is held where the definitions naming it put it | the `workstream` `delivery` held in `clean-backend` is accepted when `no other definition names it` | passed |
| repository/build | A resource is held where the definitions naming it put it | the `workstream` `reporting` held in `shared` is accepted when `neither extends the other` | passed |
| repository/build | A resource is held where the definitions naming it put it | the `workstream` `app-domain` held in `shared/cores/clean-core` is accepted when `the core they both name lists it` | passed |
| repository/build | A resource is held where the definitions naming it put it | the `validator` `standard` held in `shared` is refused when `clean-backend extends spec-plan` | passed |
| repository/build | A resource is held where the definitions naming it put it | the `workstream` `reporting` held in `clean-backend` is refused when `neither extends the other` | passed |
| repository/build | A resource is held where the definitions naming it put it | the `workstream` `app-domain` held in `clean-backend` is refused when `the core they both name lists it` | passed |
| repository/build | A resource is held where the definitions naming it put it | the `workstream` `app-domain` held in `shared` is refused when `the core they both name lists it` | passed |
| repository/build | A package declares the skills of its tools instead of carrying them | the skill `spec-writing` of `specification tool` at `2.0.0` is declared as `acme/specification/skills/spec-writing#v2.0.0` | passed |
| repository/build | A package declares the skills of its tools instead of carrying them | the skill `lint-reading` of `linter` at `1.93.0` is declared as `acme/linter/skills/lint-reading#v1.93.0` | passed |
| repository/build | A package declares the skills of its tools instead of carrying them | a skill taken from `linter`, which names no repository, stops the build | passed |
| repository/build | A schema builds through the workstreams of its core and its own | `clean-backend` naming the core `clean-core` and its own `none` builds through `app-domain, infrastructure, adapters, modules` | passed |
| repository/build | A schema builds through the workstreams of its core and its own | `clean-react` naming the core `clean-core` and its own `react-ui, react-hooks` builds through `app-domain, infrastructure, adapters, modules, react-ui, react-hooks` | passed |
| repository/build | A schema builds through the workstreams of its core and its own | `clean-backend` naming `modules`, which its core `clean-core` already lists, stops the build | passed |
| repository/build | A package declares a skill that lives in a repository of its own | the skill `component-patterns` of the repository `acme/agent-skills` at `1a2c79d` is declared as `acme/agent-skills/skills/component-patterns#1a2c79d` | passed |
| repository/build | A package declares a skill that lives in a repository of its own | the skill `interface-review` of the repository `acme/agent-skills` at `1a2c79d` is declared as `acme/agent-skills/skills/interface-review#1a2c79d` | passed |
| repository/build | A package declares a skill that lives in a repository of its own | the skill `component-patterns` taken from `acme/agent-skills` with no commit stops the build | passed |
| repository/build | A built package's command offers only what a project runs | the command built into `backend` offers `verify` as `present` | passed |
| repository/build | A built package's command offers only what a project runs | the command built into `backend` offers `check` as `present` | passed |
| repository/build | A built package's command offers only what a project runs | the command built into `backend` offers `guard` as `present` | passed |
| repository/build | A built package's command offers only what a project runs | the command built into `backend` offers `build` as `absent` | passed |
| repository/build | A built package's command offers only what a project runs | the command built into `backend` offers `release` as `absent` | passed |
| repository/build | A built package's command offers only what a project runs | the command built into `backend` offers `proof` as `absent` | passed |
| repository/build | A built package's command offers only what a project runs | the command built into `backend` offers `expect` as `absent` | passed |

## Checks

Every check passes.

## Review

Run: 0 warning(s).

## Procedures

None.
