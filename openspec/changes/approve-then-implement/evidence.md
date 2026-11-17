---
change: approve-then-implement
verdict: verified
digest: b51091f5a96dc15052424797db535274585667cd37d0ab714952d53b4042151a
---

# Evidence of approve-then-implement

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
| flow/archive | A consolidated decision keeps who took it | a `decision` tagged `@by:person` consolidates tagged `@by:person` | passed |
| flow/archive | A consolidated decision keeps who took it | a `procedure` tagged `@by:agent` consolidates tagged `@by:agent` | passed |
| flow/archive | A consolidated decision keeps who took it | a `requirement` tagged `@by:person` consolidates tagged `@by:person` | passed |
| flow/handoff | A ready change is handed to the runner the project configures | handing `add-orders` to the runner `none` gives `build add-orders in this session` | passed |
| flow/handoff | A ready change is handed to the runner the project configures | handing `add-orders` to the runner `session` gives `build add-orders in this session` | passed |
| flow/handoff | A ready change is handed to the runner the project configures | handing `add-orders` to the runner `command `remote {change}`` gives `the command received add-orders` | passed |
| flow/handoff | A ready change is handed to the runner the project configures | handing `add-orders` to the runner `command `remote {change}; exit 3`` gives `the command received add-orders` | passed |
| flow/handoff | A change that is not ready is not handed off | handing off a change that is `ready` hands off `add-orders` | passed |
| flow/handoff | A change that is not ready is not handed off | handing off a change that is `not approved` hands off `nothing` | passed |
| flow/handoff | A change that is not ready is not handed off | handing off a change that is `listing an open question` hands off `nothing` | passed |
| flow/handoff | A change that is not ready is not handed off | handing off a change that is `not approved` hands off `nothing` #2 | passed |
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
| flow/plan-validation | Every screen a web change lists is approved | a `clean-react` change with a screen approved `2026-11-16` and `1` spike task(s) is `not ready` | passed |
| flow/plan-validation | Every screen a web change lists is approved | a `clean-react` change with a screen approved `2026-11-16` and `1` spike task(s) is `not ready` #2 | passed |
| flow/plan-validation | Every screen a web change lists is approved | a `clean-react` change with a screen approved `2026-11-16` and `1` spike task(s) is `not ready` #3 | passed |
| flow/plan-validation | Every screen a web change lists is approved | a `clean-react` change with a screen approved `none` and `1` spike task(s) is `not ready` #2 | passed |
| flow/plan-validation | Every screen a web change lists is approved | a `clean-react` change with a screen approved `none` and `0` spike task(s) is `ready` | passed |
| flow/plan-validation | Every screen a web change lists is approved | a `clean-backend` change with a screen approved `none` and `0` spike task(s) is `ready` | passed |
| flow/plan-validation | Every decision names who took it | a `line under Decisions` tagged `@by:person` makes the change `ready` | passed |
| flow/plan-validation | Every decision names who took it | a `line under Decisions` tagged `@by:agent` makes the change `ready` | passed |
| flow/plan-validation | Every decision names who took it | a `line under Decisions` tagged `none` makes the change `not ready` | passed |
| flow/plan-validation | Every decision names who took it | a `line under Decisions` tagged `@by:person @by:agent` makes the change `not ready` | passed |
| flow/plan-validation | Every decision names who took it | a `line under Decisions` tagged `@by:someone` makes the change `not ready` | passed |
| flow/plan-validation | Every decision names who took it | a `architecture decision` tagged `@by:person` makes the change `ready` | passed |
| flow/plan-validation | Every decision names who took it | a `architecture decision` tagged `none` makes the change `not ready` | passed |
| flow/plan-validation | Every decision names who took it | a `procedure` tagged `@by:agent` makes the change `ready` | passed |
| flow/plan-validation | Every decision names who took it | a `procedure` tagged `none` makes the change `not ready` | passed |
| flow/plan-validation | Every decision names who took it | a `screen` tagged `@by:person` makes the change `ready` | passed |
| flow/plan-validation | Every decision names who took it | a `screen` tagged `none` makes the change `not ready` | passed |
| flow/plan-validation | Every decision names who took it | a `added requirement` tagged `@by:agent` makes the change `ready` | passed |
| flow/plan-validation | Every decision names who took it | a `added requirement` tagged `none` makes the change `not ready` | passed |
| flow/plan-validation | Every decision names who took it | a `modified requirement` tagged `@by:person` makes the change `ready` | passed |
| flow/plan-validation | Every decision names who took it | a `modified requirement` tagged `none` makes the change `not ready` | passed |
| flow/plan-validation | A change is ready only once the person approved its plan | a plan approved `2026-11-17` makes the change `ready` | passed |
| flow/plan-validation | A change is ready only once the person approved its plan | a plan approved `none` makes the change `not ready` | passed |
| flow/plan-validation | A change is ready only once the person approved its plan | a plan approved `yesterday` makes the change `not ready` | passed |
| flow/plan |  |  | passed, by the person's word |
| flow/reading | An artifact to show gets a reading copy outside the repository | the reading copy of `openspec/changes/add-orders/plan.md`, `missing`, is reported `stale` | passed |
| flow/reading | An artifact to show gets a reading copy outside the repository | the reading copy of `openspec/changes/add-orders/plan.md`, `written after the artifact`, is reported `fresh` | passed |
| flow/reading | An artifact to show gets a reading copy outside the repository | the reading copy of `openspec/changes/add-orders/plan.md`, `written before the artifact changed`, is reported `stale` | passed |
| flow/reading | An artifact to show gets a reading copy outside the repository | the reading copy of `openspec/adr/product/money.md`, `missing`, is reported `stale` | passed |
| flow/reading | The person's language overrides the project's | the language `es` of the project and `none` of the person names `a copy in es outside the repository` | passed |
| flow/reading | The person's language overrides the project's | the language `none` of the project and `pt` of the person names `a copy in pt outside the repository` | passed |
| flow/reading | The person's language overrides the project's | the language `es` of the project and `pt` of the person names `a copy in pt outside the repository` | passed |
| flow/reading | The person's language overrides the project's | the language `none` of the project and `none` of the person names `no copy` | passed |
| flow/reading | The person's language overrides the project's | the language `en` of the project and `none` of the person names `no copy` | passed |
| flow/reading | Only what the specification tool keeps gets a reading copy | asking a reading copy of `openspec/changes/add-orders/plan.md` exits with `0` | passed |
| flow/reading | Only what the specification tool keeps gets a reading copy | asking a reading copy of `src/orders/order.ts` exits with `1` | passed |
| flow/reading | Only what the specification tool keeps gets a reading copy | asking a reading copy of `README.md` exits with `1` | passed |

## Checks

Every check passes.

## Review

Run: 0 warning(s).

## Procedures

None.
