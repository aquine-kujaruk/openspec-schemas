## MODIFIED Requirements

### Requirement: Every task belongs to one workstream of the schema

Every checkbox in a plan is a task, and every task SHALL sit inside a phase. When the change's schema has workstreams, every task SHALL name one of them. When it has none, no task SHALL name a workstream. Validation SHALL report the change as not ready when a task sits outside a phase, names a workstream the schema does not have, or names none in a schema that has some.

#### Scenario Outline: a task naming `<workstream>` placed `<placement>` makes the change `<readiness>`

- **GIVEN** a change whose schema has the workstreams `<workstreams>` <!-- schemaWorkstreams -->
- **AND** its plan has a task naming the workstream `<workstream>` placed `<placement>` <!-- taskNamingWorkstreamPlaced -->
- **WHEN** the change is validated <!-- validateChange -->
- **THEN** the change is reported `<readiness>` <!-- changeReportedAs -->

##### Examples:

  | workstreams                                              | workstream | placement       | readiness |
  | -------------------------------------------------------- | ---------- | --------------- | --------- |
  | app-domain, infrastructure, adapters, modules            | app-domain | inside a phase  | ready     |
  | app-domain, infrastructure, adapters, modules            | react-ui   | inside a phase  | not ready |
  | app-domain, infrastructure, adapters, modules            | app-domain | outside a phase | not ready |
  | app-domain, infrastructure, adapters, modules            | none       | inside a phase  | not ready |
  | none                                                     | none       | inside a phase  | ready     |
  | none                                                     | app-domain | inside a phase  | not ready |
  | none                                                     | none       | outside a phase | not ready |

## ADDED Requirements

### Requirement: Every screen a web change lists is approved

In a change whose schema declares a spike workstream, each block under `## Screens` SHALL carry the tag `@approved`, valued with the date it was approved or with `declined` when the person declined to see it, and SHALL name the page it spikes. A plan with a task of the spike workstream SHALL list at least one screen. Validation SHALL report the change as not ready, naming the screen or the tag, otherwise. A change whose schema declares no spike workstream SHALL NOT be asked for screens.

#### Scenario Outline: a `<schema>` change with a screen approved `<approved>` and `<tasks>` spike task(s) is `<readiness>`

- **GIVEN** a change made with the schema `<schema>` <!-- changeWithSchema -->
- **AND** its plan has the screen `<screen>` approved `<approved>` <!-- planScreenApproved -->
- **AND** its plan has `<tasks>` task(s) of the spike workstream <!-- planSpikeTasks -->
- **WHEN** the change is validated <!-- validateChange -->
- **THEN** the change is reported `<readiness>` <!-- changeReportedAs -->

##### Examples:

  | schema        | screen      | approved   | tasks | readiness |
  | ------------- | ----------- | ---------- | ----- | --------- |
  | clean-react   | orders-list | 2026-11-16 | 1     | ready     |
  | clean-react   | orders-list | declined   | 1     | ready     |
  | clean-react   | orders-list | none       | 1     | not ready |
  | clean-react   | orders-list | yesterday  | 1     | not ready |
  | clean-react   | no screen   | none       | 1     | not ready |
  | clean-react   | no screen   | none       | 0     | ready     |
  | clean-backend | no screen   | none       | 0     | ready     |
