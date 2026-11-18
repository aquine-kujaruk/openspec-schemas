---
change: reparar-revision-semantica
verdict: verified
digest: 2624dee52b186ff299481202b8ba6be49c1747be3c0227c871fc42f279ce1d16
---

# Evidence of reparar-revision-semantica

## Scenarios

| Use case | Requirement | Scenario | Result |
| --- | --- | --- | --- |
| architecture/linting | A rubric row is verified by counterexample and by reference | Recording wrapper-id at 0.95 produces target | passed |
| architecture/linting | A rubric row is verified by counterexample and by reference | Recording wrapper-id at 0.90 produces warning | passed |
| architecture/linting | A rubric row is verified by counterexample and by reference | Recording wrapper-id at 0.8999 produces failed | passed |
| architecture/linting | A rubric row is verified by counterexample and by reference | Recording wrapper-id at 0.01 produces failed | passed |
| architecture/linting | A rubric row is verified by counterexample and by reference | Recording reference at 0.05 produces target | passed |
| architecture/linting | A rubric row is verified by counterexample and by reference | Recording reference at 0.10 produces warning | passed |
| architecture/linting | A rubric row is verified by counterexample and by reference | Recording reference at 0.1001 produces failed | passed |
| architecture/linting | A rubric row is verified by counterexample and by reference | Recording reference at 0.99 produces failed | passed |
| architecture/linting | A recorded judgement is replayed without the model | Replaying none with key absent makes 0 calls | passed |
| architecture/linting | A recorded judgement is replayed without the model | Replaying case with key present makes 1 calls | passed |
| architecture/linting | A recorded judgement is replayed without the model | Replaying question with key present makes 1 calls | passed |
| architecture/linting | A recorded judgement is replayed without the model | Replaying model with key present makes 1 calls | passed |
| architecture/linting | A recorded judgement is replayed without the model | Replaying case with key absent makes 0 calls | passed |
| architecture/linting | A recorded judgement is replayed without the model | Replaying question with key absent makes 0 calls | passed |
| architecture/linting | A recorded judgement is replayed without the model | Replaying model with key absent makes 0 calls | passed |
| architecture/linting | Every judgement joins a history the report reads | History none followed by 0.95 yields target with drift absent | passed |
| architecture/linting | Every judgement joins a history the report reads | History 0.97 0.96 0.97 followed by 0.95 yields target with drift absent | passed |
| architecture/linting | Every judgement joins a history the report reads | History 0.75 followed by 0.95 yields target with drift present | passed |
| architecture/linting | Every judgement joins a history the report reads | History 0.72 followed by 0.91 yields warning with drift absent | passed |
| architecture/linting | Every judgement joins a history the report reads | History 0.70 followed by 0.90 yields warning with drift present | passed |
| architecture/linting | Every judgement joins a history the report reads | History 0.92 0.91 0.93 followed by 0.64 yields failed with drift present | passed |
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
| factory/quality/audit | review-judges-declared-modules · review judges the modules the product declares | modules declared at `factory/*` judge `3` of `3` files | passed |
| factory/quality/audit | review-judges-declared-modules · review judges the modules the product declares | modules declared at `src/*` judge `3` of `3` files | passed |
| factory/quality/audit | review-reports-incomplete · a review that judged nothing or skipped a row says so | `3` selected files and `0` rejected rows leave the review `complete` | passed |
| factory/quality/audit | review-reports-incomplete · a review that judged nothing or skipped a row says so | `0` selected files and `0` rejected rows leave the review `incomplete: no core file selected` | passed |
| factory/quality/audit | review-reports-incomplete · a review that judged nothing or skipped a row says so | `3` selected files and `1` rejected rows leave the review `incomplete: a row was rejected` | passed |
| factory/quality/audit | review-reports-incomplete · a review that judged nothing or skipped a row says so | `3` selected files and `0` rejected rows leave the review `incomplete: the model failed` | passed |
| factory/quality/inspect-work-order | Evidence matches every scenario to what proves it | `3` of `3` scenario(s) passing makes the change `verified` | passed |
| factory/quality/inspect-work-order | Evidence matches every scenario to what proves it | `2` of `3` scenario(s) passing makes the change `not verified` | passed |
| factory/quality/inspect-work-order | Evidence matches every scenario to what proves it | `0` of `0` scenario(s) passing makes the change `verified` | passed |
| factory/quality/inspect-work-order | A failing check is feedback, never a fix | `infrastructure` failing its check raises feedback and changes `0` product file(s) | passed |
| factory/quality/inspect-work-order | A failing check is feedback, never a fix | `modules` failing its check raises feedback and changes `0` product file(s) | passed |
| factory/quality/inspect-work-order | The rubric review runs only where its key is configured | with the review key `configured` the review is `run` and the change is `verified` | passed |
| factory/quality/inspect-work-order | The rubric review runs only where its key is configured | with the review key `absent` the review is `skipped` and the change is `verified` | passed |
| factory/quality/inspect-work-order | The rubric review runs only where its key is configured | with the review key `configured` the review is `incomplete` and the change is `not verified` | passed |
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
| factory/quality/inspect-work-order | Repository suites prove each changed scenario by name | Repository assertion passing produces passed | passed |
| factory/quality/inspect-work-order | Repository suites prove each changed scenario by name | Repository assertion failed produces failed | passed |
| factory/quality/inspect-work-order | Repository suites prove each changed scenario by name | Repository assertion skipped produces failed | passed |
| factory/quality/inspect-work-order | Repository suites prove each changed scenario by name | Repository assertion absent produces missing | passed |
| factory/quality/inspect-work-order | Repository suites prove each changed scenario by name | Repository assertion other requirement produces missing | passed |
| factory/quality/inspect-work-order | Repository suites prove each changed scenario by name | Repository assertion other title produces missing | passed |

## Checks

Every check passes.

## Review

Run: 0 warning(s).

## Procedures

| Procedure | Environment | Treatment | Outcome |
| --- | --- | --- | --- |
| cambio-secuencial | local | executed | passed |
| cambio-secuencial | prod | reviewed only |  |
| maintain-architecture-rules | local | executed | passed |

## Recorded rubric cases

Vitest replayed 46 recordings for 23 rubric rows with the model key set to an empty string. The recordings used 100 of 104 authorized synthetic requests. The target was met by 39 cases. Seven passed with a confidence warning and none fell below the fail threshold.

| Case | Confidence in expected verdict |
| --- | ---: |
| S06/reference | 94% |
| S07/untested-operation | 93% |
| S10/unparsed-record | 94% |
| S11/aggregate-of-one | 94% |
| S12/misplaced-method | 93% |
| S12/reference | 93% |
| S21/raw-query-result | 91% |

Eight cases also raised a historical warning from the mean of all earlier raw probabilities. They were S03/excess-view-state, S08/cross-module-import, S12/reference, S13/reference, S13/vague-operation, S14/reference, S14/three-resource-clients and S22/rebuilt-money-format. The five measurements for each S17 example were 1,1,1,1,1 for the counterexample and 0,0,0,0,0 for the reference.

## Product audit

The full live pass reported 63 warnings across 235 files. Incremental passes checked each correction against the evolving inventory of 237 files. The last pass checked two changed files and reported zero warnings. Cross-file product checks for S07, S08, S11 and S14 are assigned to human review. Their multi-file semantic examples ran under Vitest. Every finding, source range and disposition is in the [product review](evidence/product-review.md).

The full offline regression ran 902 passing tests in 85 files. Type checking, generated-test freshness and whole-product architecture checks passed. Backend contained five workstream score histories and frontend contained seven.
