## ADDED Requirements

### Requirement: Setup notes a key a runbook needs and the environment lacks

Setup SHALL report as a note each key that a consolidated procedure names in its keys and that neither the process environment nor the project's `.env` holds, naming the procedure. A note SHALL NOT change the exit status. Setup SHALL NOT repair a missing key.

#### Scenario Outline: the key `<key>` of `<slug>`, `<presence>`, is reported `<report>` without repair

- **GIVEN** a consolidated procedure `<slug>` needing the key `<key>` <!-- runbookNeedsKey -->
- **AND** the key `<key>` is `<presence>` <!-- keyPresence -->
- **WHEN** setup runs without repair <!-- runSetupWithoutRepair -->
- **THEN** it reports `<requirement>` as `<report>` <!-- reportsRequirementAs -->
- **AND** it exits with status `<status>` <!-- setupExitStatus -->

##### Examples:

  | slug            | key              | presence           | requirement          | report       | status |
  | --------------- | ---------------- | ------------------ | -------------------- | ------------ | ------ |
  | invoices-access | INVOICES_API_KEY | absent             | the key of a runbook | note         | 0      |
  | invoices-access | INVOICES_API_KEY | in .env            | the key of a runbook | not reported | 0      |
  | invoices-access | INVOICES_API_KEY | in the environment | the key of a runbook | not reported | 0      |

#### Scenario Outline: the key `<key>` of `<slug>`, `<presence>`, is reported `<report>` after repair

- **GIVEN** a consolidated procedure `<slug>` needing the key `<key>` <!-- runbookNeedsKey -->
- **AND** the key `<key>` is `<presence>` <!-- keyPresence -->
- **WHEN** setup runs with repair <!-- runSetupWithRepair -->
- **THEN** it reports `<requirement>` as `<report>` <!-- reportsRequirementAs -->
- **AND** it exits with status `<status>` <!-- setupExitStatus -->

##### Examples:

  | slug            | key              | presence | requirement          | report | status |
  | --------------- | ---------------- | -------- | -------------------- | ------ | ------ |
  | invoices-access | INVOICES_API_KEY | absent   | the key of a runbook | note   | 0      |
