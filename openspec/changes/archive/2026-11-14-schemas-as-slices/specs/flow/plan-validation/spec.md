## MODIFIED Requirements

### Requirement: Every task belongs to one workstream of the schema

Every checkbox in a plan is a task, and every task SHALL sit inside a phase. When the change's schema has workstreams, every task SHALL name one of them. When it has none, no task SHALL name a workstream. Validation SHALL report the change as not ready when a task sits outside a phase, names a workstream the schema does not have, or names none in a schema that has some.

#### Scenario Outline: a task naming `<workstream>` placed `<placement>` makes the change `<readiness>`

- **GIVEN** a change whose schema has the workstreams `<workstreams>` <!-- schemaWorkstreams -->
- **AND** its plan has a task naming the workstream `<workstream>` placed `<placement>` <!-- taskNamingWorkstreamPlaced -->
- **WHEN** the change is validated <!-- validateChange -->
- **THEN** the change is reported `<readiness>` <!-- changeReportedAs -->

##### Examples:

  | workstreams                                                         | workstream | placement       | readiness |
  | ------------------------------------------------------------------- | ---------- | --------------- | --------- |
  | app-domain, infrastructure, adapters, clean-architecture, integrate | app-domain | inside a phase  | ready     |
  | app-domain, infrastructure, adapters, clean-architecture, integrate | react-ui   | inside a phase  | not ready |
  | app-domain, infrastructure, adapters, clean-architecture, integrate | app-domain | outside a phase | not ready |
  | app-domain, infrastructure, adapters, clean-architecture, integrate | none       | inside a phase  | not ready |
  | none                                                                | none       | inside a phase  | ready     |
  | none                                                                | app-domain | inside a phase  | not ready |
  | none                                                                | none       | outside a phase | not ready |
