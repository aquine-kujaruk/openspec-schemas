## ADDED Requirements

### Requirement: A consolidated decision keeps who took it

`@by:agent`

Archiving SHALL keep on each consolidated decision and procedure, and on each merged requirement, the `@by` its change gave it.

#### Scenario Outline: a `<kind>` tagged `<by>` consolidates tagged `<consolidated>`

- **GIVEN** a verified change `<change>` whose `<kind>` `<name>` is tagged `<by>` <!-- verifiedChangeWithKindTaggedBy -->
- **WHEN** the change `<change>` is archived on `<date>` <!-- archiveChange -->
- **THEN** the consolidated `<kind>` `<name>` is tagged `<consolidated>` <!-- consolidatedKindTagged -->

##### Examples:

  | kind        | name              | by         | consolidated | change     | date       |
  | ----------- | ----------------- | ---------- | ------------ | ---------- | ---------- |
  | decision    | money-in-cents    | @by:person | @by:person   | add-orders | 2026-11-20 |
  | procedure   | prod-logs         | @by:agent  | @by:agent    | add-orders | 2026-11-20 |
  | requirement | Orders are listed | @by:person | @by:person   | add-orders | 2026-11-20 |
