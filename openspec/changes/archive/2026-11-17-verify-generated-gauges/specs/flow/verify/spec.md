## MODIFIED Requirements

### Requirement: A scenario is matched to the test generated from its spec, where generation writes it

`@by:agent`

Verification SHALL read the scenarios of each delta spec from the test generation writes for that spec: under the configured acceptance root by module and use case in a project, including when the product specs have a custom prefix, and next to the spec's step adapter in the repository the command is developed in.

#### Scenario Outline: verifying in `<where>`, the scenarios of `<spec>` are read from `<test>`

- **GIVEN** a change of `<where>` with a delta spec `<spec>` <!-- changeOfWithDeltaSpec -->
- **AND** the step adapter of `<spec>` is held in `<adapterFolder>` <!-- stepAdapterHeldIn -->
- **WHEN** the change is verified <!-- verifyChange -->
- **THEN** its scenarios are read from the test `<test>` <!-- scenariosReadFromTest -->

##### Examples:

  | where                    | spec             | adapterFolder          | test                                             |
  | ------------------------ | ---------------- | ---------------------- | ------------------------------------------------ |
  | a project                | orders/get-order | test/acceptance/orders | test/acceptance/orders/get-order.feature.test.ts |
  | the command's repository | flow/verify      | factory/flow           | factory/flow/verify.feature.test.ts              |
  | a project                | factory/quality/audit | test/acceptance/quality | test/acceptance/quality/audit.feature.test.ts |
  | a project                | api/orders/get-order | test/acceptance/orders | test/acceptance/orders/get-order.feature.test.ts |

## ADDED Requirements

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
