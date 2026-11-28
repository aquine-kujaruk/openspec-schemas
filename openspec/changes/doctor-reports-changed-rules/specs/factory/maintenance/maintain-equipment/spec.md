## ADDED Requirements

### Requirement: Setup reports the rules an update changed and the project breaks

`@by:person`

When the installed package's rules ledger differs from the one the project last passed, setup SHALL report as `outdated` each added or changed deterministic rule the project's code breaks, naming the rule and its files, SHALL note each changed rule the project passes and each removed rule, and SHALL exit with status 1 while any rule is `outdated`. Repair SHALL NOT clear an `outdated` rule; a passing check SHALL record the new ledger and end the report.

#### Scenario Outline: a rule that is `<change>` and that the code `<state>` is reported `<report>`

- **GIVEN** a project that last passed its check under a ledger where rule `<rule>` was `<before>` <!-- recordedLedger -->
- **AND** the installed package's ledger has rule `<rule>` `<change>` <!-- installedLedger -->
- **AND** the project's code `<state>` rule `<rule>` <!-- codeAgainstRule -->
- **WHEN** setup runs without repair <!-- runSetupWithoutRepair -->
- **THEN** it reports `<requirement>` as `<report>` <!-- reportsRequirementAs -->
- **AND** it exits with status `<status>` <!-- setupExitStatus -->

##### Examples:

  | rule          | before  | change    | state    | requirement   | report       | status |
  | ------------- | ------- | --------- | -------- | ------------- | ------------ | ------ |
  | code-breathes | absent  | added     | breaks   | code-breathes | outdated     | 1      |
  | code-breathes | absent  | added     | passes   | code-breathes | note         | 0      |
  | code-breathes | present | changed   | breaks   | code-breathes | outdated     | 1      |
  | code-breathes | present | unchanged | breaks   | code-breathes | not reported | 0      |
  | code-breathes | present | removed   | passes   | code-breathes | note         | 0      |

#### Scenario Outline: an outdated rule is still `<report>` after repair

- **GIVEN** a project that last passed its check under a ledger where rule `<rule>` was `<before>` <!-- recordedLedger -->
- **AND** the installed package's ledger has rule `<rule>` `<change>` <!-- installedLedger -->
- **AND** the project's code `<state>` rule `<rule>` <!-- codeAgainstRule -->
- **WHEN** setup runs with repair <!-- runSetupWithRepair -->
- **THEN** it reports `<requirement>` as `<report>` <!-- reportsRequirementAs -->
- **AND** it exits with status `<status>` <!-- setupExitStatus -->

##### Examples:

  | rule          | before | change | state  | requirement   | report   | status |
  | ------------- | ------ | ------ | ------ | ------------- | -------- | ------ |
  | code-breathes | absent | added  | breaks | code-breathes | outdated | 1      |
