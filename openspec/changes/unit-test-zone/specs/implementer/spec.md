## MODIFIED Requirements

### Requirement: The implementer prepares the configured roots before any workstream

`@by:agent`

The configuration SHALL name the roots the product lives in (`modules`, `acceptance`, `integration`, `unit`, `entry`), and `factory prepare` SHALL create every configured root that does not exist. The implementer skill SHALL make prepare its first step, before seams and workstreams.

#### Scenario Outline: the missing root `<root>` is created from `<setting>`

- **GIVEN** the configuration sets `<setting>` to `<value>` <!-- configurationSets -->
- **AND** the directory `<root>` does not exist <!-- directoryMissing -->
- **WHEN** `factory prepare` runs <!-- prepareRuns -->
- **THEN** the directory `<root>` exists <!-- directoryExists -->

##### Examples:

  | setting     | value            | root             |
  | ----------- | ---------------- | ---------------- |
  | modules     | src/*            | src              |
  | modules     | packages/*       | packages         |
  | acceptance  | test/acceptance  | test/acceptance  |
  | integration | test/integration | test/integration |
  | unit        | test/unit        | test/unit        |
