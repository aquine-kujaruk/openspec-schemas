## MODIFIED Requirements

### Requirement: A scenario is matched to the test generated from its spec, where generation writes it

`@by:agent`

Verification SHALL read the scenarios of each delta spec from the test generation writes for that spec: under the acceptance root in a project, and next to the spec's step adapter in the repository the command is developed in.

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

