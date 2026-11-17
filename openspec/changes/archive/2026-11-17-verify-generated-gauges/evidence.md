---
change: verify-generated-gauges
verdict: verified
digest: 6e5a3d1aa0b9304fb00366ccd4a42497b2a6ba62d000072bc233c86a7d68fc53
---

# Evidence of verify-generated-gauges

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
| flow/verify | A scenario is matched to the test generated from its spec, where generation writes it | verifying in `a project`, the scenarios of `factory/quality/audit` are read from `test/acceptance/quality/audit.feature.test.ts` | passed |
| flow/verify | A scenario is matched to the test generated from its spec, where generation writes it | verifying in `a project`, the scenarios of `api/orders/get-order` are read from `test/acceptance/orders/get-order.feature.test.ts` | passed |
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
| flow/verify | A delta that only removes requirements needs no acceptance test | a removal with `nothing` needs `0` acceptance tests | passed |
| flow/verify | A delta that only removes requirements needs no acceptance test | a removal with `an addition` needs `1` acceptance tests | passed |
| flow/verify | A delta that only removes requirements needs no acceptance test | a removal with `a change` needs `1` acceptance tests | passed |
| flow/verify | A delta that only removes requirements needs no acceptance test | a removal with `a rename` needs `1` acceptance tests | passed |

## Checks

Every check passes.

## Review

Run: 0 warning(s).

## Procedures

None.
