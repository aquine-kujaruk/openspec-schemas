---
change: products-per-folder
verdict: verified
digest: 4d68a81b96f8974b0543de43f0a5f061266f84acebb6438a6833f61917806e08
---

# Evidence of products-per-folder

## Scenarios

| Use case | Requirement | Scenario | Result |
| --- | --- | --- | --- |
| flow/archive | Only a verified change is archived | `add-orders` with evidence `verified` is `archived` | passed |
| flow/archive | Only a verified change is archived | `add-orders` with evidence `not verified` is `still active` | passed |
| flow/archive | Only a verified change is archived | `add-orders` with evidence `absent` is `still active` | passed |
| flow/archive | The plan's tags are applied to the consolidated decisions | `@adds` on `money-in-cents` turns the decisions `none` into `money-in-cents` | passed |
| flow/archive | The plan's tags are applied to the consolidated decisions | `@modifies:money-in-cents` on `money-in-cents` turns the decisions `money-in-cents` into `money-in-cents` | passed |
| flow/archive | The plan's tags are applied to the consolidated decisions | `@replaces:money-in-cents` on `money-as-decimal` turns the decisions `money-in-cents` into `money-as-decimal` | passed |
| flow/archive | The plan's tags are applied to the consolidated decisions | `@renames:money-in-cents` on `integer-money` turns the decisions `money-in-cents` into `integer-money` | passed |
| flow/archive | The plan's tags are applied to the consolidated decisions | `@removes:no-router` on `no-router` turns the decisions `money-in-cents, no-router` into `money-in-cents` | passed |
| flow/archive | Every consolidated block names the change that last wrote it | `money-in-cents` written by `add-orders` on `2026-11-20` has the origin `2026-11-20-add-orders` | passed |
| flow/archive | Every consolidated block names the change that last wrote it | `money-in-cents` written by `tune-money` on `2026-12-01` has the origin `2026-12-01-tune-money` | passed |
| flow/archive | Consolidation keeps the decision and leaves the narrative in the change | a block listing `2` alternative(s) consolidates with `0` | passed |
| flow/archive | A tag that no longer holds stops the archive and raises feedback | `@replaces:money-in-cents` on `money-as-decimal` against `none` leaves `use-decimals` `still active` | passed |
| flow/archive | A tag that no longer holds stops the archive and raises feedback | `@adds` on `money-in-cents` against `money-in-cents` leaves `add-orders` `still active` | passed |
| flow/archive | A block another change rewrote since the plan saw it stops the archive | `money-in-cents` seen as `2026-11-20-add-orders` and now `2026-11-20-add-orders` leaves `tune-money` `archived` | passed |
| flow/archive | A block another change rewrote since the plan saw it stops the archive | `money-in-cents` seen as `2026-11-20-add-orders` and now `2026-11-25-add-prices` leaves `tune-money` `still active` | passed |
| flow/archive | Decisions consolidate by area and topic | `money-in-cents` of area `product` and topic `money` is consolidated in `openspec/adr/product/money.md` | passed |
| flow/archive | Decisions consolidate by area and topic | `ci-runs-checks` of area `production` and topic `delivery` is consolidated in `openspec/adr/production/delivery.md` | passed |
| flow/archive | Procedures consolidate by purpose and topic | `prod-logs` of purpose `diagnose` and topic `logs` is consolidated in `openspec/runbooks/diagnose/logs.md` | passed |
| flow/archive | Procedures consolidate by purpose and topic | `local-setup` of purpose `setup` and topic `local` is consolidated in `openspec/runbooks/setup/local.md` | passed |
| flow/archive | Spec deltas are merged and the generated tests follow them | `add-orders` with `2` delta spec(s) leaves `2` merged and `0` stale test(s) | passed |
| flow/archive | Spec deltas are merged and the generated tests follow them | `diagnose-checkout` with `0` delta spec(s) leaves `0` merged and `0` stale test(s) | passed |
| flow/archive | Archiving with no change named archives every verified change, oldest first | archiving everything archives `add-orders, tune-money` and leaves `add-refunds` | passed |
| flow/archive | Archiving with no change named archives every verified change, oldest first | archiving everything archives `none` and leaves `add-refunds` | passed |
| flow/archive | With products, decisions consolidate under their product | `money-in-cents` of the product `api` is consolidated in `openspec/adr/api/product/money.md` | passed |
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
| flow/plan |  |  | passed, by the person's word |
| implementer |  |  | passed, by the person's word |
| package/completion-gate | An agent finishes only when the change's checks pass | finishing with checks that `pass` is `allowed` | passed |
| package/completion-gate | An agent finishes only when the change's checks pass | finishing with checks that `pass` is `allowed` #2 | passed |
| package/completion-gate | An agent finishes only when the change's checks pass | finishing with checks that `fail` is `refused` | passed |
| package/completion-gate | An agent finishes only when the change's checks pass | finishing with checks that `fail` is `refused` #2 | passed |
| package/completion-gate | The third failure in a row hands the change to the person | after `0` failure(s) the change waits for `the agent` | passed |
| package/completion-gate | The third failure in a row hands the change to the person | after `1` failure(s) the change waits for `the agent` | passed |
| package/completion-gate | The third failure in a row hands the change to the person | after `2` failure(s) the change waits for `the person` | passed |
| package/completion-gate | A helper agent is held like the main one | the `helper` agent finishing with checks that `fail` is `refused` | passed |
| package/completion-gate | A helper agent is held like the main one | the `helper` agent finishing with checks that `pass` is `allowed` | passed |
| package/completion-gate | An altered harness holds the agent | finishing with `generated tests` altered is `refused` | passed |
| package/completion-gate | An altered harness holds the agent | finishing with `installed schemas` altered is `refused` | passed |
| package/completion-gate | An altered harness holds the agent | finishing with `factory configuration` altered is `refused` | passed |
| package/completion-gate | With no change in implementation the gate holds nobody | finishing with `0` change(s) in implementation is `allowed` | passed |
| package/completion-gate | With no change in implementation the gate holds nobody | finishing with `0` change(s) in implementation is `allowed` #2 | passed |
| package/completion-gate | A change is judged by the checks of its own schema | a `clean-backend` change finishing while the product's checks `fail` is `refused` | passed |
| package/completion-gate | A change is judged by the checks of its own schema | a `spec-plan` change finishing while the product's checks `fail` is `allowed` | passed |
| package/completion-gate | A change is judged by the checks of its own schema | a `spec-plan` change finishing while the product's checks `pass` is `allowed` | passed |
| package/completion-gate | A change is judged by its own product alone | a change of `api` finishing while `api` fails is `refused` | passed |
| package/completion-gate | A change is judged by its own product alone | a change of `api` finishing while `worker` fails is `allowed` | passed |
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

## Checks

Every check passes.

## Review

Run: 0 warning(s).

## Procedures

None.
