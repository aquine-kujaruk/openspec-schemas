---
change: use-cases-branch-only-on-io
verdict: verified
digest: 72fdbadf9eb055c822144bc4e0644d1fcdd3389e51fbd740127aad43e06ba045
---

# Evidence of use-cases-branch-only-on-io

## Scenarios

| Use case | Requirement | Scenario | Result |
| --- | --- | --- | --- |
| factory/change-control/authorize-write | Product code is writable only while a change is in implementation | writing `src/orders/domain/order.entity.ts` with `0` change(s) in implementation is `refused` | passed |
| factory/change-control/authorize-write | Product code is writable only while a change is in implementation | writing `src/orders/domain/order.entity.ts` with `1` change(s) in implementation is `allowed` | passed |
| factory/change-control/authorize-write | Product code is writable only while a change is in implementation | writing `test/acceptance/orders/orders.steps.ts` with `0` change(s) in implementation is `refused` | passed |
| factory/change-control/authorize-write | Product code is writable only while a change is in implementation | writing `test/acceptance/orders/orders.steps.ts` with `1` change(s) in implementation is `allowed` | passed |
| factory/change-control/authorize-write | Product code is writable only while a change is in implementation | writing `README.md` with `0` change(s) in implementation is `allowed` | passed |
| factory/change-control/authorize-write | A refused write says how to proceed | a refused write to `src/orders/domain/order.entity.ts` names the `plan` phase | passed |
| factory/change-control/authorize-write | An agent never writes the harness | writing `factory.config.ts` is refused as `factory configuration` | passed |
| factory/change-control/authorize-write | An agent never writes the harness | writing `test/acceptance/orders/list-orders.feature.test.ts` is refused as `generated tests` | passed |
| factory/change-control/authorize-write | An agent never writes the harness | writing `openspec/schemas/clean-backend/schema.yaml` is refused as `installed schemas` | passed |
| factory/change-control/authorize-write | An agent never writes the harness | writing `openspec/specs/orders/list-orders/spec.md` is refused as `consolidated specs` | passed |
| factory/change-control/authorize-write | An agent never writes the harness | writing `openspec/adr/product/money.md` is refused as `consolidated decisions` | passed |
| factory/change-control/authorize-write | An agent never writes the harness | writing `openspec/runbooks/diagnose/logs.md` is refused as `consolidated procedures` | passed |
| factory/change-control/authorize-write | An agent never writes the harness | writing `openspec/changes/archive/2026-11-13-add-orders/plan.md` is refused as `archived changes` | passed |
| factory/change-control/authorize-write | An agent never writes the harness | writing `.claude/settings.json` is refused as `agent guards` | passed |
| factory/change-control/authorize-write | An agent never writes the harness | writing `.agents/skills/plan/SKILL.md` is refused as `agent skills` | passed |
| factory/change-control/authorize-write | An agent never writes the harness | writing `node_modules/factory/factory/main.js` is refused as `installed command` | passed |
| factory/change-control/authorize-write | A write that touches several files is refused when any of them is | one write touching `src/orders/domain/order.entity.ts, src/orders/index.ts` is `allowed` | passed |
| factory/change-control/authorize-write | A write that touches several files is refused when any of them is | one write touching `src/orders/domain/order.entity.ts, factory.config.ts` is `refused` | passed |
| factory/change-control/authorize-write | A write that touches several files is refused when any of them is | one write touching `README.md, src/orders/domain/order.entity.ts` is `refused` | passed |
| factory/change-control/authorize-write | A change's own artifacts are writable while it is active | writing `openspec/changes/add-orders/plan.md` of the active change `add-orders` is `allowed` | passed |
| factory/change-control/authorize-write | A change's own artifacts are writable while it is active | writing `openspec/changes/add-orders/specs/orders/list-orders/spec.md` of the active change `add-orders` is `allowed` | passed |
| factory/change-control/authorize-write | A change's own artifacts are writable while it is active | writing `openspec/changes/add-orders/plan.md` of the active change `add-orders` is `allowed` #2 | passed |
| factory/change-control/authorize-write | Product code opens only to a change whose schema builds it | with a `clean-backend` change in implementation, writing `src/orders/domain/order.entity.ts` is `allowed` | passed |
| factory/change-control/authorize-write | Product code opens only to a change whose schema builds it | with a `spec-plan` change in implementation, writing `src/orders/domain/order.entity.ts` is `refused` | passed |
| factory/change-control/authorize-write | Product code opens only to a change whose schema builds it | with a `spec-plan` change in implementation, writing `docs/outage.md` is `allowed` | passed |
| factory/change-control/authorize-write | A product's folder opens only to that product's change | with a change of `api` in implementation, writing `apps/api/src/orders/domain/order.entity.ts` is `allowed` | passed |
| factory/change-control/authorize-write | A product's folder opens only to that product's change | with a change of `api` in implementation, writing `apps/worker/src/billing/domain/charge.entity.ts` is `refused` | passed |
| factory/change-control/authorize-write | A product's folder opens only to that product's change | with a change of `contracts` in implementation, writing `packages/contracts/src/orders.ts` is `allowed` | passed |
| factory/change-control/authorize-write | A product's folder opens only to that product's change | with a change of `contracts` in implementation, writing `apps/api/src/orders/domain/order.entity.ts` is `refused` | passed |
| factory/change-control/authorize-write | A write the policy already resolved reads no work order | a write to `openspec/specs/a.md` reads the work orders `0` time(s) | passed |
| factory/change-control/authorize-write | A write the policy already resolved reads no work order | a write to `README.md` reads the work orders `0` time(s) | passed |
| factory/change-control/authorize-write | A write the policy already resolved reads no work order | a write to `src/orders/domain/order.entity.ts` reads the work orders `1` time(s) | passed |

## Checks

Every check passes.

## Review

Skipped: the project configures no OPENAI_API_KEY.

## Procedures

None.
