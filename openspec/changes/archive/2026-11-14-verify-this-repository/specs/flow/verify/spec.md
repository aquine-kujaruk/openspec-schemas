## ADDED Requirements

### Requirement: A scenario is matched to the test generated from its spec, where generation writes it

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
  | the command's repository | flow/verify      | toolkit/flow           | toolkit/flow/verify.feature.test.ts              |

### Requirement: A spec no test is generated from is proved by the person's word

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
