---
change: factory-as-clean-backend
verdict: verified
digest: f1cc0d6e902e2c5c730116048a3a3914a9fc3614739e90680f3f7d7ed5271786
---

# Evidence of factory-as-clean-backend

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
| factory/maintenance/maintain-equipment | Setup pins the command at the version the skills name | the command goes from `none` to `1.2.0` when the skills name `1.2.0` | passed |
| factory/maintenance/maintain-equipment | Setup pins the command at the version the skills name | the command goes from `1.2.0` to `1.2.0` when the skills name `1.2.0` | passed |
| factory/maintenance/maintain-equipment | Setup pins the command at the version the skills name | the command goes from `1.2.0` to `1.3.0` when the skills name `1.3.0` | passed |
| factory/maintenance/maintain-equipment | Setup makes every packaged schema resolvable | `clean-backend` resolves and the default goes from `none` to `clean-backend` | passed |
| factory/maintenance/maintain-equipment | Setup makes every packaged schema resolvable | `legacy-to-specs` resolves and the default goes from `none` to `clean-backend` | passed |
| factory/maintenance/maintain-equipment | Setup makes every packaged schema resolvable | `legacy-to-specs` resolves and the default goes from `spec-driven` to `spec-driven` | passed |
| factory/maintenance/maintain-equipment | Setup without repair reports and changes nothing | a project lacking `the pinned command` is reported and left as it was | passed |
| factory/maintenance/maintain-equipment | Setup without repair reports and changes nothing | a project lacking `a schema link` is reported and left as it was | passed |
| factory/maintenance/maintain-equipment | Setup without repair reports and changes nothing | a project lacking `a test runner` is reported and left as it was | passed |
| factory/maintenance/maintain-equipment | Setup without repair reports and changes nothing | a project lacking `a type checker` is reported and left as it was | passed |
| factory/maintenance/maintain-equipment | Setup repairs only what the package owns | `the pinned command` is `repaired` after setup with repair | passed |
| factory/maintenance/maintain-equipment | Setup repairs only what the package owns | `a schema link` is `repaired` after setup with repair | passed |
| factory/maintenance/maintain-equipment | Setup repairs only what the package owns | `the consolidated roots` is `repaired` after setup with repair | passed |
| factory/maintenance/maintain-equipment | Setup repairs only what the package owns | `a test runner` is `missing` after setup with repair | passed |
| factory/maintenance/maintain-equipment | Setup repairs only what the package owns | `a type checker` is `missing` after setup with repair | passed |
| factory/maintenance/maintain-equipment | Setup adds the flow instruction to an instruction file the project wrote | a file with `3` own line(s) holds the flow instruction `1` time(s) | passed |
| factory/maintenance/maintain-equipment | Setup adds the flow instruction to an instruction file the project wrote | a file with `3` own line(s) holds the flow instruction `1` time(s) #2 | passed |
| factory/maintenance/maintain-equipment | Setup adds the flow instruction to an instruction file the project wrote | a file with `0` own line(s) holds the flow instruction `1` time(s) | passed |
| factory/maintenance/maintain-equipment | Skills and command of different versions are reported as drift | skills at `1.3.0` and the command at `1.2.0` are reported as drift | passed |
| factory/maintenance/maintain-equipment | Every agent the package names has the flow | `the phase skills` missing for `codex` is reported | passed |
| factory/maintenance/maintain-equipment | Every agent the package names has the flow | `the flow instruction` missing for `claude` is reported | passed |
| factory/maintenance/maintain-equipment | Every agent the package names has the flow | `the guards` missing for `codex` is reported | passed |
| factory/maintenance/maintain-equipment | Setup notes a key a runbook needs and the environment lacks | the key `INVOICES_API_KEY` of `invoices-access`, `absent`, is reported `note` without repair | passed |
| factory/maintenance/maintain-equipment | Setup notes a key a runbook needs and the environment lacks | the key `INVOICES_API_KEY` of `invoices-access`, `in .env`, is reported `not reported` without repair | passed |
| factory/maintenance/maintain-equipment | Setup notes a key a runbook needs and the environment lacks | the key `INVOICES_API_KEY` of `invoices-access`, `in the environment`, is reported `not reported` without repair | passed |
| factory/maintenance/maintain-equipment | Setup notes a key a runbook needs and the environment lacks | the key `INVOICES_API_KEY` of `invoices-access`, `absent`, is reported `note` after repair | passed |
| factory/maintenance/maintain-equipment | Setup reports the end-to-end tools a web product lacks | a `web` product whose project declares `nothing` is reported `missing` | passed |
| factory/maintenance/maintain-equipment | Setup reports the end-to-end tools a web product lacks | a `web` product whose project declares `e2e@0.22.0, @e2e-dev/web@0.15.4, @e2e-dev/acp@0.1.0` is reported `not reported` | passed |
| factory/maintenance/maintain-equipment | Setup reports the end-to-end tools a web product lacks | a `web` product whose project declares `e2e@0.23.1, @e2e-dev/web@0.15.4, @e2e-dev/acp@0.1.0` is reported `missing` | passed |
| factory/maintenance/maintain-equipment | Setup reports the end-to-end tools a web product lacks | a `node` product whose project declares `nothing` is reported `not reported` | passed |
| factory/maintenance/maintain-equipment | Setup flags a runbook that runs what the project no longer has | a runbook that runs `pnpm run start` where the project holds `the script dev` is reported `suspect` | passed |
| factory/maintenance/maintain-equipment | Setup flags a runbook that runs what the project no longer has | a runbook that runs `pnpm run dev` where the project holds `the script dev` is reported `not reported` | passed |
| factory/maintenance/maintain-equipment | Setup flags a runbook that runs what the project no longer has | a runbook that runs `pnpm dev` where the project holds `the script dev` is reported `not reported` | passed |
| factory/maintenance/maintain-equipment | Setup flags a runbook that runs what the project no longer has | a runbook that runs `pnpm exec react-scripts start` where the project holds `the binary vite` is reported `suspect` | passed |
| factory/maintenance/maintain-equipment | Setup flags a runbook that runs what the project no longer has | a runbook that runs `pnpm exec vite` where the project holds `the binary vite` is reported `not reported` | passed |
| factory/maintenance/maintain-equipment | Setup flags a runbook that runs what the project no longer has | a runbook that runs `npx create-vite@5.5.0 web` where the project holds `nothing` is reported `not reported` | passed |
| factory/maintenance/maintain-equipment | Setup flags a runbook that runs what the project no longer has | a runbook that runs `node scripts/seed.mjs` where the project holds `the file scripts/load.mjs` is reported `suspect` | passed |
| factory/maintenance/maintain-equipment | Setup flags a runbook that runs what the project no longer has | a runbook that runs `./scripts/seed.sh` where the project holds `the file scripts/seed.sh` is reported `not reported` | passed |
| factory/maintenance/maintain-equipment | Setup flags a runbook that runs what the project no longer has | a runbook that runs `kubectl logs deploy/api` where the project holds `nothing` is reported `not reported` | passed |
| factory/maintenance/maintain-equipment | Setup flags a runbook that runs what the project no longer has | a runbook that runs `pnpm run start` is still reported `suspect` after repair | passed |
| factory/production/close-work-order | Only a verified change is archived | `add-orders` with evidence `verified` is `archived` | passed |
| factory/production/close-work-order | Only a verified change is archived | `add-orders` with evidence `not verified` is `still active` | passed |
| factory/production/close-work-order | Only a verified change is archived | `add-orders` with evidence `absent` is `still active` | passed |
| factory/production/close-work-order | The plan's tags are applied to the consolidated decisions | `@adds` on `money-in-cents` turns the decisions `none` into `money-in-cents` | passed |
| factory/production/close-work-order | The plan's tags are applied to the consolidated decisions | `@modifies:money-in-cents` on `money-in-cents` turns the decisions `money-in-cents` into `money-in-cents` | passed |
| factory/production/close-work-order | The plan's tags are applied to the consolidated decisions | `@replaces:money-in-cents` on `money-as-decimal` turns the decisions `money-in-cents` into `money-as-decimal` | passed |
| factory/production/close-work-order | The plan's tags are applied to the consolidated decisions | `@renames:money-in-cents` on `integer-money` turns the decisions `money-in-cents` into `integer-money` | passed |
| factory/production/close-work-order | The plan's tags are applied to the consolidated decisions | `@removes:no-router` on `no-router` turns the decisions `money-in-cents, no-router` into `money-in-cents` | passed |
| factory/production/close-work-order | Every consolidated block names the change that last wrote it | `money-in-cents` written by `add-orders` on `2026-11-20` has the origin `2026-11-20-add-orders` | passed |
| factory/production/close-work-order | Every consolidated block names the change that last wrote it | `money-in-cents` written by `tune-money` on `2026-12-01` has the origin `2026-12-01-tune-money` | passed |
| factory/production/close-work-order | Consolidation keeps the decision and leaves the narrative in the change | a block listing `2` alternative(s) consolidates with `0` | passed |
| factory/production/close-work-order | A tag that no longer holds stops the archive and raises feedback | `@replaces:money-in-cents` on `money-as-decimal` against `none` leaves `use-decimals` `still active` | passed |
| factory/production/close-work-order | A tag that no longer holds stops the archive and raises feedback | `@adds` on `money-in-cents` against `money-in-cents` leaves `add-orders` `still active` | passed |
| factory/production/close-work-order | A block another change rewrote since the plan saw it stops the archive | `money-in-cents` seen as `2026-11-20-add-orders` and now `2026-11-20-add-orders` leaves `tune-money` `archived` | passed |
| factory/production/close-work-order | A block another change rewrote since the plan saw it stops the archive | `money-in-cents` seen as `2026-11-20-add-orders` and now `2026-11-25-add-prices` leaves `tune-money` `still active` | passed |
| factory/production/close-work-order | Decisions consolidate by area and topic | `money-in-cents` of area `product` and topic `money` is consolidated in `openspec/adr/product/money.md` | passed |
| factory/production/close-work-order | Decisions consolidate by area and topic | `ci-runs-checks` of area `production` and topic `delivery` is consolidated in `openspec/adr/production/delivery.md` | passed |
| factory/production/close-work-order | Procedures consolidate by purpose and topic | `prod-logs` of purpose `diagnose` and topic `logs` is consolidated in `openspec/runbooks/diagnose/logs.md` | passed |
| factory/production/close-work-order | Procedures consolidate by purpose and topic | `local-setup` of purpose `setup` and topic `local` is consolidated in `openspec/runbooks/setup/local.md` | passed |
| factory/production/close-work-order | Spec deltas are merged and the generated tests follow them | `add-orders` with `2` delta spec(s) leaves `2` merged and `0` stale test(s) | passed |
| factory/production/close-work-order | Spec deltas are merged and the generated tests follow them | `diagnose-checkout` with `0` delta spec(s) leaves `0` merged and `0` stale test(s) | passed |
| factory/production/close-work-order | Archiving with no change named archives every verified change, oldest first | archiving everything archives `add-orders, tune-money` and leaves `add-refunds` | passed |
| factory/production/close-work-order | Archiving with no change named archives every verified change, oldest first | archiving everything archives `none` and leaves `add-refunds` | passed |
| factory/production/close-work-order | With products, decisions consolidate under their product | `money-in-cents` of the product `api` is consolidated in `openspec/adr/api/product/money.md` | passed |
| factory/production/close-work-order | A consolidated decision keeps who took it | a `decision` tagged `@by:person` consolidates tagged `@by:person` | passed |
| factory/production/close-work-order | A consolidated decision keeps who took it | a `procedure` tagged `@by:agent` consolidates tagged `@by:agent` | passed |
| factory/production/close-work-order | A consolidated decision keeps who took it | a `requirement` tagged `@by:person` consolidates tagged `@by:person` | passed |
| factory/production/dispatch-work-order | A ready change is handed to the runner the project configures | handing `add-orders` to the runner `none` gives `build add-orders in this session` | passed |
| factory/production/dispatch-work-order | A ready change is handed to the runner the project configures | handing `add-orders` to the runner `session` gives `build add-orders in this session` | passed |
| factory/production/dispatch-work-order | A ready change is handed to the runner the project configures | handing `add-orders` to the runner `command `remote {change}`` gives `the command received add-orders` | passed |
| factory/production/dispatch-work-order | A ready change is handed to the runner the project configures | handing `add-orders` to the runner `command `remote {change}; exit 3`` gives `the command received add-orders` | passed |
| factory/production/dispatch-work-order | A change that is not ready is not handed off | handing off a change that is `ready` hands off `add-orders` | passed |
| factory/production/dispatch-work-order | A change that is not ready is not handed off | handing off a change that is `not approved` hands off `nothing` | passed |
| factory/production/dispatch-work-order | A change that is not ready is not handed off | handing off a change that is `listing an open question` hands off `nothing` | passed |
| factory/production/dispatch-work-order | A change that is not ready is not handed off | handing off a change that is `not approved` hands off `nothing` #2 | passed |
| factory/production/make-reading-copies | An artifact to show gets a reading copy outside the repository | the reading copy of `openspec/changes/add-orders/plan.md`, `missing`, is reported `stale` | passed |
| factory/production/make-reading-copies | An artifact to show gets a reading copy outside the repository | the reading copy of `openspec/changes/add-orders/plan.md`, `written after the artifact`, is reported `fresh` | passed |
| factory/production/make-reading-copies | An artifact to show gets a reading copy outside the repository | the reading copy of `openspec/changes/add-orders/plan.md`, `written before the artifact changed`, is reported `stale` | passed |
| factory/production/make-reading-copies | An artifact to show gets a reading copy outside the repository | the reading copy of `openspec/adr/product/money.md`, `missing`, is reported `stale` | passed |
| factory/production/make-reading-copies | The person's language overrides the project's | the language `es` of the project and `none` of the person names `a copy in es outside the repository` | passed |
| factory/production/make-reading-copies | The person's language overrides the project's | the language `none` of the project and `pt` of the person names `a copy in pt outside the repository` | passed |
| factory/production/make-reading-copies | The person's language overrides the project's | the language `es` of the project and `pt` of the person names `a copy in pt outside the repository` | passed |
| factory/production/make-reading-copies | The person's language overrides the project's | the language `none` of the project and `none` of the person names `no copy` | passed |
| factory/production/make-reading-copies | The person's language overrides the project's | the language `en` of the project and `none` of the person names `no copy` | passed |
| factory/production/make-reading-copies | Only what the specification tool keeps gets a reading copy | asking a reading copy of `openspec/changes/add-orders/plan.md` exits with `0` | passed |
| factory/production/make-reading-copies | Only what the specification tool keeps gets a reading copy | asking a reading copy of `src/orders/order.ts` exits with `1` | passed |
| factory/production/make-reading-copies | Only what the specification tool keeps gets a reading copy | asking a reading copy of `README.md` exits with `1` | passed |
| factory/production/pull-andon | Feedback updates the change it is about | feedback from `the person` about `add-orders` leaves `1` active change(s) | passed |
| factory/production/pull-andon | Feedback updates the change it is about | feedback from `the completion gate` about `add-orders` leaves `1` active change(s) | passed |
| factory/production/pull-andon | Feedback updates the change it is about | feedback from `the verify phase` about `add-orders` leaves `2` active change(s) | passed |
| factory/production/pull-andon | Feedback updates the change it is about | feedback from `the archive` about `add-orders` leaves `1` active change(s) | passed |
| factory/production/pull-andon | Feedback reopens only what it invalidates | feedback naming phase `2` turns the done phases `1, 2` into `1` | passed |
| factory/production/pull-andon | Feedback reopens only what it invalidates | feedback naming phase `1` turns the done phases `1, 2` into `none` | passed |
| factory/production/pull-andon | Feedback reopens only what it invalidates | feedback naming phase `2` turns the done phases `1` into `1` | passed |
| factory/production/pull-andon | Feedback the agent cannot settle becomes an open question | feedback needing `1` decision(s) from the person leaves the change `not ready` | passed |
| factory/production/pull-andon | Feedback the agent cannot settle becomes an open question | feedback needing `0` decision(s) from the person leaves the change `ready` | passed |
| factory/quality/audit | review-apart-from-verdict · review exits zero and runs after the deterministic tools | the review prints `0` warnings and exits zero | passed |
| factory/quality/audit | review-apart-from-verdict · review exits zero and runs after the deterministic tools | the review prints `3` warnings and exits zero | passed |
| factory/quality/audit | review-needs-configured-key · review refuses to run without the configured key | a `present` key leads to `the model is called and warnings print` | passed |
| factory/quality/audit | review-needs-configured-key · review refuses to run without the configured key | a `absent` key leads to `the variable's name prints and status is 2` | passed |
| factory/quality/audit | review-scopes-touched-files · review judges only the files touched since its last pass | `2` touched files after `none` are judged | passed |
| factory/quality/audit | review-scopes-touched-files · review judges only the files touched since its last pass | `2` touched files after `recorded` are judged | passed |
| factory/quality/audit | review-scopes-touched-files · review judges only the files touched since its last pass | `0` touched files after `recorded` are judged | passed |
| factory/quality/audit | review-scopes-touched-files · review judges only the files touched since its last pass | `0` touched files after `recorded under another rubric` are judged | passed |
| factory/quality/audit | review-narrows-to-lines · review narrows every finding from files to lines | a row found in `one method` is reported as `1` ranges | passed |
| factory/quality/audit | review-narrows-to-lines · review narrows every finding from files to lines | a row found in `two methods` is reported as `2` ranges | passed |
| factory/quality/audit | review-narrows-to-lines · review narrows every finding from files to lines | a row found in `the whole class header` is reported as `1` ranges | passed |
| factory/quality/audit | review-finding-names-row-and-certainty · every review warning names its row, certainty, file and lines | probability `0.93` against threshold `0.85` prints `S09 p=0.93 at the file and lines of the span` | passed |
| factory/quality/audit | review-finding-names-row-and-certainty · every review warning names its row, certainty, file and lines | probability `0.60` against threshold `0.85` prints `nothing` | passed |
| factory/quality/audit | review-finding-names-row-and-certainty · every review warning names its row, certainty, file and lines | probability `0.85` against threshold `0.85` prints `S05 p=0.85 at the file and lines of the span` | passed |
| factory/quality/audit | review-rows-are-generic · rubric questions name no product | the row `S09` worded as `this domain file names a technology, library or provider` is `accepted` | passed |
| factory/quality/audit | review-rows-are-generic · rubric questions name no product | the row `S09` worded as `this domain file names the payment provider of the product` is `rejected` | passed |
| factory/quality/audit | review-asks-core-and-schema-rows · review asks the rows of the core and the rows of the schema | a product of `clean-backend` is asked the rows `S05, S06` | passed |
| factory/quality/audit | review-asks-core-and-schema-rows · review asks the rows of the core and the rows of the schema | a product of `clean-react` is asked the rows `S05, S06, S01, S02` | passed |
| factory/quality/hold-stage | An agent finishes only when the change's checks pass | finishing with checks that `pass` is `allowed` | passed |
| factory/quality/hold-stage | An agent finishes only when the change's checks pass | finishing with checks that `pass` is `allowed` #2 | passed |
| factory/quality/hold-stage | An agent finishes only when the change's checks pass | finishing with checks that `fail` is `refused` | passed |
| factory/quality/hold-stage | An agent finishes only when the change's checks pass | finishing with checks that `fail` is `refused` #2 | passed |
| factory/quality/hold-stage | The third failure in a row hands the change to the person | after `0` failure(s) the change waits for `the agent` | passed |
| factory/quality/hold-stage | The third failure in a row hands the change to the person | after `1` failure(s) the change waits for `the agent` | passed |
| factory/quality/hold-stage | The third failure in a row hands the change to the person | after `2` failure(s) the change waits for `the person` | passed |
| factory/quality/hold-stage | A helper agent is held like the main one | the `helper` agent finishing with checks that `fail` is `refused` | passed |
| factory/quality/hold-stage | A helper agent is held like the main one | the `helper` agent finishing with checks that `pass` is `allowed` | passed |
| factory/quality/hold-stage | An altered harness holds the agent | finishing with `generated tests` altered is `refused` | passed |
| factory/quality/hold-stage | An altered harness holds the agent | finishing with `installed schemas` altered is `refused` | passed |
| factory/quality/hold-stage | An altered harness holds the agent | finishing with `factory configuration` altered is `refused` | passed |
| factory/quality/hold-stage | With no change in implementation the gate holds nobody | finishing with `0` change(s) in implementation is `allowed` | passed |
| factory/quality/hold-stage | With no change in implementation the gate holds nobody | finishing with `0` change(s) in implementation is `allowed` #2 | passed |
| factory/quality/hold-stage | A change is judged by the checks of its own schema | a `clean-backend` change finishing while the product's checks `fail` is `refused` | passed |
| factory/quality/hold-stage | A change is judged by the checks of its own schema | a `spec-plan` change finishing while the product's checks `fail` is `allowed` | passed |
| factory/quality/hold-stage | A change is judged by the checks of its own schema | a `spec-plan` change finishing while the product's checks `pass` is `allowed` | passed |
| factory/quality/hold-stage | A change is judged by its own product alone | a change of `api` finishing while `api` fails is `refused` | passed |
| factory/quality/hold-stage | A change is judged by its own product alone | a change of `api` finishing while `worker` fails is `allowed` | passed |
| factory/quality/inspect-work-order | Evidence matches every scenario to what proves it | `3` of `3` scenario(s) passing makes the change `verified` | passed |
| factory/quality/inspect-work-order | Evidence matches every scenario to what proves it | `2` of `3` scenario(s) passing makes the change `not verified` | passed |
| factory/quality/inspect-work-order | Evidence matches every scenario to what proves it | `0` of `0` scenario(s) passing makes the change `verified` | passed |
| factory/quality/inspect-work-order | A failing check is feedback, never a fix | `infrastructure` failing its check raises feedback and changes `0` product file(s) | passed |
| factory/quality/inspect-work-order | A failing check is feedback, never a fix | `modules` failing its check raises feedback and changes `0` product file(s) | passed |
| factory/quality/inspect-work-order | The rubric review runs only where its key is configured | with the review key `configured` the review is `run` and the change is `verified` | passed |
| factory/quality/inspect-work-order | The rubric review runs only where its key is configured | with the review key `absent` the review is `skipped` and the change is `verified` | passed |
| factory/quality/inspect-work-order | A review warning is recorded and fails nothing | `2` review warning(s) leave the change `verified` | passed |
| factory/quality/inspect-work-order | A review warning is recorded and fails nothing | `0` review warning(s) leave the change `verified` | passed |
| factory/quality/inspect-work-order | A procedure is exercised only in the environments where that is safe | a procedure tagged for `local` is recorded as `executed` | passed |
| factory/quality/inspect-work-order | A procedure is exercised only in the environments where that is safe | a procedure tagged for `sandbox` is recorded as `executed` | passed |
| factory/quality/inspect-work-order | A procedure is exercised only in the environments where that is safe | a procedure tagged for `prod` is recorded as `reviewed only` | passed |
| factory/quality/inspect-work-order | A procedure is exercised only in the environments where that is safe | a procedure in `sandbox` probed `declined` with outcome `none` is recorded as `declined` and the change is `verified` | passed |
| factory/quality/inspect-work-order | A procedure is exercised only in the environments where that is safe | a procedure in `sandbox` probed `declined` with outcome `passed` is recorded as `executed` and the change is `verified` | passed |
| factory/quality/inspect-work-order | A procedure is exercised only in the environments where that is safe | a procedure in `sandbox` probed `2026-11-16` with outcome `none` is recorded as `not executed` and the change is `not verified` | passed |
| factory/quality/inspect-work-order | A scenario is matched to the test generated from its spec, where generation writes it | verifying in `a project`, the scenarios of `orders/get-order` are read from `test/acceptance/orders/get-order.feature.test.ts` | passed |
| factory/quality/inspect-work-order | A scenario is matched to the test generated from its spec, where generation writes it | verifying in `the command's repository`, the scenarios of `architecture/domain` are read from `schemas/shared/cores/clean-core/workstreams/app-domain/domain.feature.test.ts` | passed |
| factory/quality/inspect-work-order | A scenario is matched to the test generated from its spec, where generation writes it | verifying in `the command's repository`, the scenarios of `factory/quality/inspect-work-order` are read from `test/acceptance/quality/inspect-work-order.feature.test.ts` | passed |
| factory/quality/inspect-work-order | A scenario is matched to the test generated from its spec, where generation writes it | verifying in `a project`, the scenarios of `factory/quality/audit` are read from `test/acceptance/quality/audit.feature.test.ts` | passed |
| factory/quality/inspect-work-order | A scenario is matched to the test generated from its spec, where generation writes it | verifying in `a project`, the scenarios of `api/orders/get-order` are read from `test/acceptance/orders/get-order.feature.test.ts` | passed |
| factory/quality/inspect-work-order | A spec no test is generated from is proved by the person's word | in `the command's repository`, `flow/plan` with `0` generated test(s) and the person's word `none` is `unproved` | passed |
| factory/quality/inspect-work-order | A spec no test is generated from is proved by the person's word | in `the command's repository`, `flow/plan` with `0` generated test(s) and the person's word `proved` is `proved by the person's word` | passed |
| factory/quality/inspect-work-order | A spec no test is generated from is proved by the person's word | in `a project`, `orders/get-order` with `0` generated test(s) and the person's word `proved` is `unproved` | passed |
| factory/quality/inspect-work-order | Verify proves the product works as a whole | on a `web` product, `nothing fails` makes the change `verified`, feedback on `nothing` | passed |
| factory/quality/inspect-work-order | Verify proves the product works as a whole | on a `web` product, `no-unused-files names src/orders/framework/ui/orders-list/old-row.component.tsx` makes the change `not verified`, feedback on `react-ui` | passed |
| factory/quality/inspect-work-order | Verify proves the product works as a whole | on a `web` product, `duplication-below-threshold names src/orders/domain/entities/order.entity.ts` makes the change `not verified`, feedback on `app-domain` | passed |
| factory/quality/inspect-work-order | Verify proves the product works as a whole | on a `web` product, `the end-to-end test cancel-order fails` makes the change `not verified`, feedback on `the change` | passed |
| factory/quality/inspect-work-order | Verify proves the product works as a whole | on a `node` product, `no-unused-files names src/orders/infrastructure/acl/order.acl.ts` makes the change `not verified`, feedback on `infrastructure` | passed |
| factory/quality/inspect-work-order | Verify proves the product works as a whole | on a `node` product, `nothing fails, and it has no end-to-end tests` makes the change `verified`, feedback on `nothing` | passed |
| factory/quality/inspect-work-order | Verify proves the product works as a whole | the end-to-end test `cancel-order` `passes` is recorded `passed` | passed |
| factory/quality/inspect-work-order | Verify proves the product works as a whole | the end-to-end test `cancel-order` `fails` is recorded `failed` | passed |
| factory/quality/inspect-work-order | A delta that only removes requirements needs no acceptance test | a removal with `nothing` needs `0` acceptance tests | passed |
| factory/quality/inspect-work-order | A delta that only removes requirements needs no acceptance test | a removal with `an addition` needs `1` acceptance tests | passed |
| factory/quality/inspect-work-order | A delta that only removes requirements needs no acceptance test | a removal with `a change` needs `1` acceptance tests | passed |
| factory/quality/inspect-work-order | A delta that only removes requirements needs no acceptance test | a removal with `a rename` needs `1` acceptance tests | passed |

## Checks

Every check passes.

## Review

Run: 0 warning(s).

## Procedures

None.
