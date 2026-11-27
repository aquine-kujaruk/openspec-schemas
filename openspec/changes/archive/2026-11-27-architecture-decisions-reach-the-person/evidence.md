---
change: architecture-decisions-reach-the-person
verdict: verified
digest: 8c7db441470c84a4d80e8a64955481a5f36726a2a9d167cce43a519bdcf1c1e0
---

# Evidence of architecture-decisions-reach-the-person

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
| flow/plan-validation | Every decision names who took it | a `architecture decision` tagged `@by:agent` makes the change `not ready` | passed |
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

## Checks

Every check passes.

## Review

Run: 0 warning(s).

## Procedures

None.
