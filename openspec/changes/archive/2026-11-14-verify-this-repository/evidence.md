---
change: verify-this-repository
verdict: verified
digest: 3b58d00a03fe2a0e639ccb94d4eb32ecf85f4dd441415b70ce372cf9bb20919e
---

# Evidence of verify-this-repository

## Scenarios

| Use case | Requirement | Scenario | Result |
| --- | --- | --- | --- |
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
| flow/verify | A scenario is matched to the test generated from its spec, where generation writes it | verifying in `a project`, the scenarios of `orders/get-order` are read from `test/acceptance/orders/get-order.feature.test.ts` | passed |
| flow/verify | A scenario is matched to the test generated from its spec, where generation writes it | verifying in `the command's repository`, the scenarios of `flow/verify` are read from `toolkit/flow/verify.feature.test.ts` | passed |
| flow/verify | A spec no test is generated from is proved by the person's word | in `the command's repository`, `flow/plan` with `0` generated test(s) and the person's word `none` is `unproved` | passed |
| flow/verify | A spec no test is generated from is proved by the person's word | in `the command's repository`, `flow/plan` with `0` generated test(s) and the person's word `proved` is `proved by the person's word` | passed |
| flow/verify | A spec no test is generated from is proved by the person's word | in `a project`, `orders/get-order` with `0` generated test(s) and the person's word `proved` is `unproved` | passed |
| implementer |  |  | passed, by the person's word |

## Checks

Every check passes.

## Review

Skipped: the project configures no OPENAI_API_KEY.

## Procedures

None.
