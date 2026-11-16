## ADDED Requirements

### Requirement: An access procedure records that it was probed

Each procedure of purpose `access` that adds, modifies, replaces or renames SHALL carry the tag `@probed`, valued with the date of the probe or with `declined` when the person declined the call. Validation SHALL report the change as not ready, naming the tag, when an access procedure lacks it or carries another value. A procedure of any other purpose SHALL NOT need it.

#### Scenario Outline: a procedure of purpose `<purpose>` probed `<probed>` makes the change `<readiness>`

- **GIVEN** a change whose plan has the procedure block `<slug>` of purpose `<purpose>` probed `<probed>` <!-- procedureBlockOfPurposeProbed -->
- **WHEN** the change is validated <!-- validateChange -->
- **THEN** the change is reported `<readiness>` <!-- changeReportedAs -->

##### Examples:

  | slug            | purpose  | probed     | readiness |
  | --------------- | -------- | ---------- | --------- |
  | invoices-access | access   | 2026-11-16 | ready     |
  | invoices-access | access   | declined   | ready     |
  | invoices-access | access   | none       | not ready |
  | invoices-access | access   | yesterday  | not ready |
  | prod-logs       | diagnose | none       | ready     |
