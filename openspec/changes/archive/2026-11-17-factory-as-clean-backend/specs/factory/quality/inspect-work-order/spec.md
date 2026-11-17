## Purpose

Verifying a change: the checks and tests the schema's validator names are run on what was built, every scenario of the change is matched to what proves it, and the result is written as evidence. Verifying judges and records; it never fixes.

## ADDED Requirements

### Requirement: Evidence matches every scenario to what proves it

`@by:agent`

The verify phase SHALL write evidence that matches each scenario of the change to the test that proves it, and SHALL report the change as verified only when every scenario is matched to a passing test and every check passes. A change with no scenario SHALL be verified on its checks alone.

#### Scenario Outline: `<passing>` of `<scenarios>` scenario(s) passing makes the change `<verdict>`

- **GIVEN** a built change with `<scenarios>` scenario(s) <!-- builtChangeWithScenarios -->
- **AND** `<passing>` of them pass their acceptance test <!-- scenariosPassing -->
- **AND** every check of its workstreams passes <!-- everyCheckPasses -->
- **WHEN** the change is verified <!-- verifyChange -->
- **THEN** the evidence matches `<passing>` scenario(s) to a passing test <!-- evidenceMatchesScenarios -->
- **AND** the change is reported `<verdict>` <!-- changeReportedAs -->

##### Examples:

  | scenarios | passing | verdict      |
  | --------- | ------- | ------------ |
  | 3         | 3       | verified     |
  | 3         | 2       | not verified |
  | 0         | 0       | verified     |

### Requirement: A failing check is feedback, never a fix

`@by:agent`

When a check or a test fails, the verify phase SHALL raise feedback naming the workstream it belongs to and SHALL change no file of the product.

#### Scenario Outline: `<workstream>` failing its check raises feedback and changes `<changedFiles>` product file(s)

- **GIVEN** a built change with `<scenarios>` scenario(s) <!-- builtChangeWithScenarios -->
- **AND** the workstream `<workstream>` fails its check <!-- workstreamFailsCheck -->
- **WHEN** the change is verified <!-- verifyChange -->
- **THEN** feedback is raised naming the workstream `<workstream>` <!-- feedbackNamesWorkstream -->
- **AND** the change is reported `<verdict>` <!-- changeReportedAs -->
- **AND** `<changedFiles>` file(s) of the product changed <!-- productFilesChanged -->

##### Examples:

  | scenarios | workstream     | verdict      | changedFiles |
  | --------- | -------------- | ------------ | ------------ |
  | 3         | infrastructure | not verified | 0            |
  | 3         | modules        | not verified | 0            |

### Requirement: The rubric review runs only where its key is configured

`@by:agent`

The verify phase SHALL run the rubric review when the project configures the review's key, and SHALL skip it otherwise. The evidence SHALL say which happened. Whether the review ran SHALL NOT change the verdict.

#### Scenario Outline: with the review key `<key>` the review is `<review>` and the change is `<verdict>`

- **GIVEN** a built change with `<scenarios>` scenario(s) <!-- builtChangeWithScenarios -->
- **AND** `<passing>` of them pass their acceptance test <!-- scenariosPassing -->
- **AND** every check of its workstreams passes <!-- everyCheckPasses -->
- **AND** the project's review key is `<key>` <!-- reviewKeyIs -->
- **WHEN** the change is verified <!-- verifyChange -->
- **THEN** the evidence records the review as `<review>` <!-- evidenceRecordsReviewAs -->
- **AND** the change is reported `<verdict>` <!-- changeReportedAs -->

##### Examples:

  | scenarios | passing | key        | review  | verdict  |
  | --------- | ------- | ---------- | ------- | -------- |
  | 3         | 3       | configured | run     | verified |
  | 3         | 3       | absent     | skipped | verified |

### Requirement: A review warning is recorded and fails nothing

`@by:agent`

Each warning the rubric review raises SHALL be listed in the evidence with its row and its certainty. A warning SHALL NOT make the change not verified.

#### Scenario Outline: `<warnings>` review warning(s) leave the change `<verdict>`

- **GIVEN** a built change with `<scenarios>` scenario(s) <!-- builtChangeWithScenarios -->
- **AND** `<passing>` of them pass their acceptance test <!-- scenariosPassing -->
- **AND** every check of its workstreams passes <!-- everyCheckPasses -->
- **AND** the project's review key is `<key>` <!-- reviewKeyIs -->
- **AND** the review raises `<warnings>` warning(s) <!-- reviewRaisesWarnings -->
- **WHEN** the change is verified <!-- verifyChange -->
- **THEN** the evidence lists `<warnings>` review warning(s) <!-- evidenceListsWarnings -->
- **AND** the change is reported `<verdict>` <!-- changeReportedAs -->

##### Examples:

  | scenarios | passing | key        | warnings | verdict  |
  | --------- | ------- | ---------- | -------- | -------- |
  | 3         | 3       | configured | 2        | verified |
  | 3         | 3       | configured | 0        | verified |

### Requirement: A procedure is exercised only in the environments where that is safe

`@by:agent`

For each procedure the change's plan carries, the verify phase SHALL execute it in the `local` and `sandbox` environments it is tagged with and record the outcome of its verification step. It SHALL NOT execute a procedure in `prod`; there the evidence SHALL record the procedure as reviewed only. A procedure the person declined while planning, and for which no outcome is given, SHALL be recorded as declined and SHALL NOT make the change not verified; given an outcome, it SHALL be recorded as executed like any other.

#### Scenario Outline: a procedure tagged for `<env>` is recorded as `<treatment>`

- **GIVEN** a built change with `<scenarios>` scenario(s) <!-- builtChangeWithScenarios -->
- **AND** its plan carries a procedure tagged for the environment `<env>` <!-- planProcedureTaggedFor -->
- **WHEN** the change is verified <!-- verifyChange -->
- **THEN** the evidence records the procedure in `<env>` as `<treatment>` <!-- evidenceRecordsProcedureAs -->

##### Examples:

  | scenarios | env     | treatment     |
  | --------- | ------- | ------------- |
  | 0         | local   | executed      |
  | 0         | sandbox | executed      |
  | 0         | prod    | reviewed only |

#### Scenario Outline: a procedure in `<env>` probed `<probed>` with outcome `<outcome>` is recorded as `<treatment>` and the change is `<verdict>`

- **GIVEN** a built change with `<scenarios>` scenario(s) <!-- builtChangeWithScenarios -->
- **AND** its plan carries a procedure in `<env>` probed `<probed>` <!-- planProcedureProbedAs -->
- **AND** the procedure's outcome is `<outcome>` <!-- procedureOutcomeIs -->
- **WHEN** the change is verified <!-- verifyChange -->
- **THEN** the evidence records the procedure in `<env>` as `<treatment>` <!-- evidenceRecordsProcedureAs -->
- **AND** the change is reported `<verdict>` <!-- changeReportedAs -->

##### Examples:

  | scenarios | env     | probed     | outcome | treatment    | verdict      |
  | --------- | ------- | ---------- | ------- | ------------ | ------------ |
  | 0         | sandbox | declined   | none    | declined     | verified     |
  | 0         | sandbox | declined   | passed  | executed     | verified     |
  | 0         | sandbox | 2026-11-16 | none    | not executed | not verified |

### Requirement: A scenario is matched to the test generated from its spec, where generation writes it

`@by:agent`

Verification SHALL read the scenarios of each delta spec from the test generation writes for that spec: under the configured acceptance root of the line that owns the spec, by module and use case even with a custom spec prefix, and next to the spec's step adapter for a spec of the repository the command is developed in that no line declares.

#### Scenario Outline: verifying in `<where>`, the scenarios of `<spec>` are read from `<test>`

- **GIVEN** a change of `<where>` with a delta spec `<spec>` <!-- changeOfWithDeltaSpec -->
- **AND** the step adapter of `<spec>` is held in `<adapterFolder>` <!-- stepAdapterHeldIn -->
- **WHEN** the change is verified <!-- verifyChange -->
- **THEN** its scenarios are read from the test `<test>` <!-- scenariosReadFromTest -->

##### Examples:

  | where                    | spec             | adapterFolder          | test                                             |
  | ------------------------ | ---------------- | ---------------------- | ------------------------------------------------ |
  | a project                | orders/get-order | test/acceptance/orders | test/acceptance/orders/get-order.feature.test.ts |
  | the command's repository | architecture/domain | schemas/shared/cores/clean-core/workstreams/app-domain | schemas/shared/cores/clean-core/workstreams/app-domain/domain.feature.test.ts |
  | the command's repository | factory/quality/inspect-work-order | test/acceptance/quality | test/acceptance/quality/inspect-work-order.feature.test.ts |
  | a project                | factory/quality/audit | test/acceptance/quality | test/acceptance/quality/audit.feature.test.ts |
  | a project                | api/orders/get-order | test/acceptance/orders | test/acceptance/orders/get-order.feature.test.ts |

### Requirement: A spec no test is generated from is proved by the person's word

`@by:agent`

In the repository the command is developed in, generation writes no test for a spec that has no step adapter. Verification SHALL report such a delta spec as unproved and the change as not verified, unless the person states that the spec is proved; the evidence SHALL then record that spec as proved by the person's word. In a project the person's word SHALL prove nothing: a spec without a generated test stays unproved.

#### Scenario Outline: in `<where>`, `<spec>` with `<tests>` generated test(s) and the person's word `<word>` is `<proof>`

- **GIVEN** a change of `<where>` with a delta spec `<spec>` <!-- changeOfWithDeltaSpec -->
- **AND** generation writes `<tests>` test(s) for `<spec>` <!-- generationWritesTests -->
- **AND** the person's word on `<spec>` is `<word>` <!-- personsWordOn -->
- **WHEN** the change is verified <!-- verifyChange -->
- **THEN** the evidence records `<spec>` as `<proof>` <!-- evidenceRecordsSpecAs -->
- **AND** the change is reported `<verdict>` <!-- changeReportedAs -->

##### Examples:

  | where                    | spec             | tests | word   | proof                       | verdict      |
  | ------------------------ | ---------------- | ----- | ------ | --------------------------- | ------------ |
  | the command's repository | flow/plan        | 0     | none   | unproved                    | not verified |
  | the command's repository | flow/plan        | 0     | proved | proved by the person's word | verified     |
  | a project                | orders/get-order | 0     | proved | unproved                    | not verified |

### Requirement: Verify proves the product works as a whole

`@by:agent`

Verify SHALL run, besides every workstream's check and the product tests, the whole-product checks and, for a product whose platform is `web`, its end-to-end tests. It SHALL record each end-to-end test in the evidence with its result. A failing whole-product check or end-to-end test SHALL make the change not verified and SHALL be raised as feedback on the workstream that owns the file it names, or on the change when it names none. Verify SHALL change no file of the product.

#### Scenario Outline: on a `<platform>` product, `<failure>` makes the change `<verdict>`, feedback on `<raisedOn>`

- **GIVEN** a built change of a `<platform>` product <!-- builtChangeOfPlatform -->
- **AND** `<failure>` <!-- wholeProductFailure -->
- **WHEN** the change is verified <!-- verifyChange -->
- **THEN** the change is reported `<verdict>` <!-- changeReportedAs -->
- **AND** feedback is raised on `<raisedOn>` <!-- feedbackRaisedOn -->

##### Examples:

  | platform | failure                                                                              | verdict      | raisedOn          |
  | -------- | ------------------------------------------------------------------------------------ | ------------ | ----------------- |
  | web      | nothing fails                                                                        | verified     | nothing           |
  | web      | no-unused-files names src/orders/framework/ui/orders-list/old-row.component.tsx      | not verified | react-ui          |
  | web      | duplication-below-threshold names src/orders/domain/entities/order.entity.ts         | not verified | app-domain        |
  | web      | the end-to-end test cancel-order fails                                               | not verified | the change        |
  | node     | no-unused-files names src/orders/infrastructure/acl/order.acl.ts                     | not verified | infrastructure    |
  | node     | nothing fails, and it has no end-to-end tests                                        | verified     | nothing           |

#### Scenario Outline: the end-to-end test `<test>` `<result>` is recorded `<recorded>`

- **GIVEN** a built change of a `<platform>` product <!-- builtChangeOfPlatform -->
- **AND** the end-to-end test `<test>` `<result>` <!-- e2eTestResult -->
- **WHEN** the change is verified <!-- verifyChange -->
- **THEN** the evidence records `<test>` as `<recorded>` <!-- evidenceRecordsE2e -->

##### Examples:

  | platform | test         | result | recorded |
  | -------- | ------------ | ------ | -------- |
  | web      | cancel-order | passes | passed   |
  | web      | cancel-order | fails  | failed   |

### Requirement: A delta that only removes requirements needs no acceptance test

`@by:person`

Verification SHALL exclude delta specs that only remove requirements from acceptance evidence. A delta with a removal and another operation SHALL still require proof. The rest of the change's checks and evidence SHALL still determine its verdict.

#### Scenario Outline: a removal with `<remaining>` needs `<tests>` acceptance tests

- **GIVEN** a built change removes a requirement with `<remaining>` in the same delta <!-- removalLeaves -->
- **AND** the remaining acceptance test is `<status>` <!-- remainingAcceptanceIs -->
- **WHEN** the change is verified <!-- verifyChange -->
- **THEN** it requests `<tests>` acceptance test files <!-- acceptanceFilesRequested -->
- **AND** the change is reported `<verdict>` <!-- changeReportedAs -->

##### Examples:

  | remaining    | status  | tests | verdict      |
  | nothing      | missing | 0     | verified     |
  | an addition  | missing | 1     | not verified |
  | a change     | passing | 1     | verified     |
  | a rename     | missing | 1     | not verified |
