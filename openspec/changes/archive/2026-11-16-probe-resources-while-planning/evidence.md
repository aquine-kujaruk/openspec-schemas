---
change: probe-resources-while-planning
verdict: verified
digest: 172fd37c4b409f7cea9a84318b831eaff955f4b9af91ab6a3659149ce97bbfd9
---

# Evidence of probe-resources-while-planning

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
| flow/plan |  |  | passed, by the person's word |
| flow/verify | Evidence matches every scenario to what proves it | `3` of `3` scenario(s) passing makes the change `verified` | passed |
| flow/verify | Evidence matches every scenario to what proves it | `2` of `3` scenario(s) passing makes the change `not verified` | passed |
| flow/verify | Evidence matches every scenario to what proves it | `0` of `0` scenario(s) passing makes the change `verified` | passed |
| flow/verify | A failing check is feedback, never a fix | `infrastructure` failing its check raises feedback and changes `0` product file(s) | passed |
| flow/verify | A failing check is feedback, never a fix | `integrate` failing its check raises feedback and changes `0` product file(s) | passed |
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

## Checks

Every check passes.

## Review

Run: 0 warning(s).

## Procedures

None.
