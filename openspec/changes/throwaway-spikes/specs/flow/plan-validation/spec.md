## MODIFIED Requirements

### Requirement: Every screen a web change lists is approved

In a change whose schema declares a spike workstream, each block under `## Screens` SHALL carry the tag `@approved`, valued with the date it was approved or with `declined` when the person declined to see it, SHALL name the page the implementation will build (`@page`), and SHALL name its spike (`@spike`), an HTML file under the change's `spikes/` folder that exists. A plan with a task of the spike workstream SHALL list at least one screen. Validation SHALL report the change as not ready, naming the screen or the tag, otherwise. A change whose schema declares no spike workstream SHALL NOT be asked for screens.

#### Scenario Outline: a `<schema>` change with a screen approved `<approved>` and `<tasks>` spike task(s) is `<readiness>`

- **GIVEN** a change made with the schema `<schema>` <!-- changeWithSchema -->
- **AND** its plan has the screen `<screen>` approved `<approved>` <!-- planScreenApproved -->
- **AND** the screen's spike `<spike>` <!-- screenSpike -->
- **AND** its plan has `<tasks>` task(s) of the spike workstream <!-- planSpikeTasks -->
- **WHEN** the change is validated <!-- validateChange -->
- **THEN** the change is reported `<readiness>` <!-- changeReportedAs -->

##### Examples:

  | schema        | screen      | approved   | spike                   | tasks | readiness |
  | ------------- | ----------- | ---------- | ----------------------- | ----- | --------- |
  | clean-react   | orders-list | 2026-11-16 | exists                  | 1     | ready     |
  | clean-react   | orders-list | declined   | exists                  | 1     | ready     |
  | clean-react   | orders-list | none       | exists                  | 1     | not ready |
  | clean-react   | orders-list | yesterday  | exists                  | 1     | not ready |
  | clean-react   | orders-list | 2026-11-16 | is named but missing    | 1     | not ready |
  | clean-react   | orders-list | 2026-11-16 | is not named            | 1     | not ready |
  | clean-react   | orders-list | 2026-11-16 | lies outside the change | 1     | not ready |
  | clean-react   | no screen   | none       | is not named            | 1     | not ready |
  | clean-react   | no screen   | none       | is not named            | 0     | ready     |
  | clean-backend | no screen   | none       | is not named            | 0     | ready     |
