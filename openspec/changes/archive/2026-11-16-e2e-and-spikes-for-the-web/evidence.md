---
change: e2e-and-spikes-for-the-web
verdict: verified
digest: d046b6860947c8f9c952ac3c6a16f6c9353063564793af8153946f3a739e052a
---

# Evidence of e2e-and-spikes-for-the-web

## Scenarios

| Use case | Requirement | Scenario | Result |
| --- | --- | --- | --- |
| flow/plan-validation | A plan with an open question is not ready | a plan listing `0` open question(s) is `ready` | passed |
| flow/plan-validation | A plan with an open question is not ready | a plan listing `1` open question(s) is `not ready` | passed |
| flow/plan-validation | Every durable block carries exactly one operation tag | the `decision` block `money-in-cents` with `1` operation tag(s) makes the change `ready` | passed |
| flow/plan-validation | Every durable block carries exactly one operation tag | the `decision` block `money-in-cents` with `0` operation tag(s) makes the change `not ready` | passed |
| flow/plan-validation | Every durable block carries exactly one operation tag | the `decision` block `money-in-cents` with `2` operation tag(s) makes the change `not ready` | passed |
| flow/plan-validation | Every durable block carries exactly one operation tag | the `procedure` block `prod-logs` with `0` operation tag(s) makes the change `not ready` | passed |
| flow/plan-validation | An operation tag holds against the consolidated tree | `@adds` on `money-in-cents` against the consolidated decisions `none` is `ready` | passed |
| flow/plan-validation | An operation tag holds against the consolidated tree | `@adds` on `money-in-cents` against the consolidated decisions `money-in-cents` is `not ready` | passed |
| flow/plan-validation | An operation tag holds against the consolidated tree | `@replaces:money-in-cents` on `money-as-decimal` against the consolidated decisions `money-in-cents` is `ready` | passed |
| flow/plan-validation | An operation tag holds against the consolidated tree | `@replaces:money-in-cents` on `money-as-decimal` against the consolidated decisions `none` is `not ready` | passed |
| flow/plan-validation | An operation tag holds against the consolidated tree | `@modifies:money-in-cents` on `money-in-cents` against the consolidated decisions `money-in-cents` is `ready` | passed |
| flow/plan-validation | An operation tag holds against the consolidated tree | `@removes:no-router` on `no-router` against the consolidated decisions `none` is `not ready` | passed |
| flow/plan-validation | An operation on a standing block records the origin it saw | `@modifies:money-in-cents` with base `2026-11-01-add-money` on a block of origin `2026-11-01-add-money` is `ready` | passed |
| flow/plan-validation | An operation on a standing block records the origin it saw | `@modifies:money-in-cents` with base `2026-11-01-add-money` on a block of origin `2026-11-08-add-refunds` is `not ready` | passed |
| flow/plan-validation | An operation on a standing block records the origin it saw | `@removes:money-in-cents` with base `none` on a block of origin `2026-11-01-add-money` is `not ready` | passed |
| flow/plan-validation | A decision says where it applies and what enforces it | a decision block lacking `@applies` makes the change not ready | passed |
| flow/plan-validation | A decision says where it applies and what enforces it | a decision block lacking `@enforced` makes the change not ready | passed |
| flow/plan-validation | A decision says where it applies and what enforces it | a decision block lacking `@area` makes the change not ready | passed |
| flow/plan-validation | A decision says where it applies and what enforces it | a decision block lacking `@topic` makes the change not ready | passed |
| flow/plan-validation | A procedure says its purpose and its environments | a procedure block lacking `@purpose` makes the change not ready | passed |
| flow/plan-validation | A procedure says its purpose and its environments | a procedure block lacking `@env` makes the change not ready | passed |
| flow/plan-validation | A procedure says its purpose and its environments | a procedure block lacking `@topic` makes the change not ready | passed |
| flow/plan-validation | A procedure says its purpose and its environments | a procedure of purpose `diagnose` makes the change `ready` | passed |
| flow/plan-validation | A procedure says its purpose and its environments | a procedure of purpose `setup` makes the change `ready` | passed |
| flow/plan-validation | A procedure says its purpose and its environments | a procedure of purpose `misc` makes the change `not ready` | passed |
| flow/plan-validation | A procedure holds where a secret is kept, never the secret | a procedure step holding `the name of the secret's store` makes the change `ready` | passed |
| flow/plan-validation | A procedure holds where a secret is kept, never the secret | a procedure step holding `a value shaped like an access key` makes the change `not ready` | passed |
| flow/plan-validation | Every task belongs to one workstream of the schema | a task naming `app-domain` placed `inside a phase` makes the change `ready` | passed |
| flow/plan-validation | Every task belongs to one workstream of the schema | a task naming `react-ui` placed `inside a phase` makes the change `not ready` | passed |
| flow/plan-validation | Every task belongs to one workstream of the schema | a task naming `app-domain` placed `outside a phase` makes the change `not ready` | passed |
| flow/plan-validation | Every task belongs to one workstream of the schema | a task naming `none` placed `inside a phase` makes the change `not ready` | passed |
| flow/plan-validation | Every task belongs to one workstream of the schema | a task naming `none` placed `inside a phase` makes the change `ready` | passed |
| flow/plan-validation | Every task belongs to one workstream of the schema | a task naming `app-domain` placed `inside a phase` makes the change `not ready` | passed |
| flow/plan-validation | Every task belongs to one workstream of the schema | a task naming `none` placed `outside a phase` makes the change `not ready` | passed |
| flow/plan-validation | A change without delta specs says so | `1` delta spec(s) with the no-behaviour mark `absent` is `ready` | passed |
| flow/plan-validation | A change without delta specs says so | `0` delta spec(s) with the no-behaviour mark `set` is `ready` | passed |
| flow/plan-validation | A change without delta specs says so | `0` delta spec(s) with the no-behaviour mark `absent` is `not ready` | passed |
| flow/plan-validation | A change without delta specs says so | `1` delta spec(s) with the no-behaviour mark `set` is `not ready` | passed |
| flow/plan-validation | A change names one declared product of its schema | a `clean-backend` change naming `api` is `ready` | passed |
| flow/plan-validation | A change names one declared product of its schema | a `spec-plan` change naming `contracts` is `ready` | passed |
| flow/plan-validation | A change names one declared product of its schema | a `spec-plan` change naming `api` is `not ready` | passed |
| flow/plan-validation | A change names one declared product of its schema | a `clean-backend` change naming `web` is `not ready` | passed |
| flow/plan-validation | A change names one declared product of its schema | a `clean-backend` change naming `none` is `not ready` | passed |
| flow/plan-validation | Linked changes name each other | `add-orders-api` linking `add-orders-web`, which links `add-orders-api`, is `ready` | passed |
| flow/plan-validation | Linked changes name each other | `add-orders-api` linking `add-orders-web`, which links `none`, is `not ready` | passed |
| flow/plan-validation | Linked changes name each other | `add-orders-api` linking `missing-change`, which links `none`, is `not ready` | passed |
| flow/plan-validation | An access procedure records that it was probed | a procedure of purpose `access` probed `2026-11-16` makes the change `ready` | passed |
| flow/plan-validation | An access procedure records that it was probed | a procedure of purpose `access` probed `declined` makes the change `ready` | passed |
| flow/plan-validation | An access procedure records that it was probed | a procedure of purpose `access` probed `none` makes the change `not ready` | passed |
| flow/plan-validation | An access procedure records that it was probed | a procedure of purpose `access` probed `yesterday` makes the change `not ready` | passed |
| flow/plan-validation | An access procedure records that it was probed | a procedure of purpose `diagnose` probed `none` makes the change `ready` | passed |
| flow/plan-validation | Every screen a web change lists is approved | a `clean-react` change with a screen approved `2026-11-16` and `1` spike task(s) is `ready` | passed |
| flow/plan-validation | Every screen a web change lists is approved | a `clean-react` change with a screen approved `declined` and `1` spike task(s) is `ready` | passed |
| flow/plan-validation | Every screen a web change lists is approved | a `clean-react` change with a screen approved `none` and `1` spike task(s) is `not ready` | passed |
| flow/plan-validation | Every screen a web change lists is approved | a `clean-react` change with a screen approved `yesterday` and `1` spike task(s) is `not ready` | passed |
| flow/plan-validation | Every screen a web change lists is approved | a `clean-react` change with a screen approved `none` and `1` spike task(s) is `not ready` #2 | passed |
| flow/plan-validation | Every screen a web change lists is approved | a `clean-react` change with a screen approved `none` and `0` spike task(s) is `ready` | passed |
| flow/plan-validation | Every screen a web change lists is approved | a `clean-backend` change with a screen approved `none` and `0` spike task(s) is `ready` | passed |
| flow/plan |  |  | passed, by the person's word |
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
| flow/verify | A scenario is matched to the test generated from its spec, where generation writes it | verifying in `the command's repository`, the scenarios of `flow/verify` are read from `toolkit/flow/verify.feature.test.ts` | passed |
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
| implementer |  |  | passed, by the person's word |
| package/setup | Setup pins the command at the version the skills name | the command goes from `none` to `1.2.0` when the skills name `1.2.0` | passed |
| package/setup | Setup pins the command at the version the skills name | the command goes from `1.2.0` to `1.2.0` when the skills name `1.2.0` | passed |
| package/setup | Setup pins the command at the version the skills name | the command goes from `1.2.0` to `1.3.0` when the skills name `1.3.0` | passed |
| package/setup | Setup makes every packaged schema resolvable | `clean-backend` resolves and the default goes from `none` to `clean-backend` | passed |
| package/setup | Setup makes every packaged schema resolvable | `legacy-to-specs` resolves and the default goes from `none` to `clean-backend` | passed |
| package/setup | Setup makes every packaged schema resolvable | `legacy-to-specs` resolves and the default goes from `spec-driven` to `spec-driven` | passed |
| package/setup | Setup without repair reports and changes nothing | a project lacking `the pinned command` is reported and left as it was | passed |
| package/setup | Setup without repair reports and changes nothing | a project lacking `a schema link` is reported and left as it was | passed |
| package/setup | Setup without repair reports and changes nothing | a project lacking `a test runner` is reported and left as it was | passed |
| package/setup | Setup without repair reports and changes nothing | a project lacking `a type checker` is reported and left as it was | passed |
| package/setup | Setup repairs only what the package owns | `the pinned command` is `repaired` after setup with repair | passed |
| package/setup | Setup repairs only what the package owns | `a schema link` is `repaired` after setup with repair | passed |
| package/setup | Setup repairs only what the package owns | `the consolidated roots` is `repaired` after setup with repair | passed |
| package/setup | Setup repairs only what the package owns | `a test runner` is `missing` after setup with repair | passed |
| package/setup | Setup repairs only what the package owns | `a type checker` is `missing` after setup with repair | passed |
| package/setup | Setup adds the flow instruction to an instruction file the project wrote | a file with `3` own line(s) holds the flow instruction `1` time(s) | passed |
| package/setup | Setup adds the flow instruction to an instruction file the project wrote | a file with `3` own line(s) holds the flow instruction `1` time(s) #2 | passed |
| package/setup | Setup adds the flow instruction to an instruction file the project wrote | a file with `0` own line(s) holds the flow instruction `1` time(s) | passed |
| package/setup | Skills and command of different versions are reported as drift | skills at `1.3.0` and the command at `1.2.0` are reported as drift | passed |
| package/setup | Every agent the package names has the flow | `the phase skills` missing for `codex` is reported | passed |
| package/setup | Every agent the package names has the flow | `the flow instruction` missing for `claude` is reported | passed |
| package/setup | Every agent the package names has the flow | `the guards` missing for `codex` is reported | passed |
| package/setup | Setup notes a key a runbook needs and the environment lacks | the key `INVOICES_API_KEY` of `invoices-access`, `absent`, is reported `note` without repair | passed |
| package/setup | Setup notes a key a runbook needs and the environment lacks | the key `INVOICES_API_KEY` of `invoices-access`, `in .env`, is reported `not reported` without repair | passed |
| package/setup | Setup notes a key a runbook needs and the environment lacks | the key `INVOICES_API_KEY` of `invoices-access`, `in the environment`, is reported `not reported` without repair | passed |
| package/setup | Setup notes a key a runbook needs and the environment lacks | the key `INVOICES_API_KEY` of `invoices-access`, `absent`, is reported `note` after repair | passed |
| package/setup | Setup reports the end-to-end tools a web product lacks | a `web` product whose project declares `nothing` is reported `missing` | passed |
| package/setup | Setup reports the end-to-end tools a web product lacks | a `web` product whose project declares `e2e@0.22.0, @e2e-dev/web@0.15.4, @e2e-dev/acp@0.1.0` is reported `not reported` | passed |
| package/setup | Setup reports the end-to-end tools a web product lacks | a `web` product whose project declares `e2e@0.23.1, @e2e-dev/web@0.15.4, @e2e-dev/acp@0.1.0` is reported `missing` | passed |
| package/setup | Setup reports the end-to-end tools a web product lacks | a `node` product whose project declares `nothing` is reported `not reported` | passed |
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
| package/write-guard | An agent never writes the harness | writing `node_modules/factory/toolkit/cli.js` is refused as `installed command` | passed |
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
| package/write-guard | A change being planned opens the paths of its spike workstream | planning a `clean-react` change, writing `src/orders/framework/ui/orders-list/orders-list.page.tsx` is `allowed` | passed |
| package/write-guard | A change being planned opens the paths of its spike workstream | planning a `clean-react` change, writing `src/orders/framework/controllers/orders-list.controller.ts` is `allowed` | passed |
| package/write-guard | A change being planned opens the paths of its spike workstream | planning a `clean-react` change, writing `src/main.tsx` is `allowed` | passed |
| package/write-guard | A change being planned opens the paths of its spike workstream | planning a `clean-react` change, writing `src/orders/domain/order.entity.ts` is `refused` | passed |
| package/write-guard | A change being planned opens the paths of its spike workstream | planning a `clean-react` change, writing `src/orders/framework/queries/orders.query.ts` is `refused` | passed |
| package/write-guard | A change being planned opens the paths of its spike workstream | planning a `clean-backend` change, writing `src/orders/domain/order.entity.ts` is `refused` | passed |
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

## Checks

Every check passes.

## Review

Run: 0 warning(s).

## Procedures

None.
