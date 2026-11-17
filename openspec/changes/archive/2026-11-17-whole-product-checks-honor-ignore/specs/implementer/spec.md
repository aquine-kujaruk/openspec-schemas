## ADDED Requirements

### Requirement: Whole-product checks see the same product the zones see

`@by:agent`

`no-unused-files` and `duplication-below-threshold` SHALL leave out every path the configuration lists under `ignore`, as the zones of the workstreams do, and `no-unused-files` SHALL count every test under the configured acceptance, unit and integration roots as reached.

#### Scenario Outline: `<path>` is reported by `<rule>` as `<reported>`

- **GIVEN** the configuration ignores `<ignore>` <!-- configurationIgnores -->
- **AND** the unreached or duplicated file `<path>` <!-- unreachedFile -->
- **WHEN** `factory check` runs <!-- checkRuns -->
- **THEN** rule `<rule>` reports `<path>` as `<reported>` <!-- ruleReports -->

##### Examples:

  | ignore       | path                                          | rule                        | reported |
  | ------------ | --------------------------------------------- | --------------------------- | -------- |
  | tools/**     | tools/build.ts                                | no-unused-files             | no       |
  | tools/**     | tools/build.ts                                | duplication-below-threshold | no       |
  | nothing      | tools/build.ts                                | no-unused-files             | yes      |
  | nothing      | test/unit/orders/domain/order.entity.test.ts  | no-unused-files             | no       |
