## MODIFIED Requirements

### Requirement: Every decision names who took it

`@by:person`

Each line under the plan's Decisions, each architecture decision, procedure and screen of the plan, and each requirement a delta spec of the change adds or modifies SHALL carry exactly one of `@by:person` and `@by:agent`; a requirement carries it as the first line of its text. An architecture decision binds future changes, so it SHALL carry `@by:person`: the person takes it, by answering an open question or by asking for it. Validation SHALL report the change as not ready, naming the decision, while one carries neither, both, or another value, or while an architecture decision carries `@by:agent`.

#### Scenario Outline: a `<kind>` tagged `<by>` makes the change `<readiness>`

- **GIVEN** a change whose `<kind>` `<name>` is tagged `<by>` <!-- decisionOfKindTaggedBy -->
- **WHEN** the change is validated <!-- validateChange -->
- **THEN** the change is reported `<readiness>` <!-- changeReportedAs -->

##### Examples:

  | kind                  | name              | by                    | readiness |
  | --------------------- | ----------------- | --------------------- | --------- |
  | line under Decisions  | money-in-cents    | @by:person            | ready     |
  | line under Decisions  | money-in-cents    | @by:agent             | ready     |
  | line under Decisions  | money-in-cents    | none                  | not ready |
  | line under Decisions  | money-in-cents    | @by:person @by:agent  | not ready |
  | line under Decisions  | money-in-cents    | @by:someone           | not ready |
  | architecture decision | money-in-cents    | @by:person            | ready     |
  | architecture decision | money-in-cents    | @by:agent             | not ready |
  | architecture decision | money-in-cents    | none                  | not ready |
  | procedure             | prod-logs         | @by:agent             | ready     |
  | procedure             | prod-logs         | none                  | not ready |
  | screen                | orders-list       | @by:person            | ready     |
  | screen                | orders-list       | none                  | not ready |
  | added requirement     | Orders are listed | @by:agent             | ready     |
  | added requirement     | Orders are listed | none                  | not ready |
  | modified requirement  | Orders are listed | @by:person            | ready     |
  | modified requirement  | Orders are listed | none                  | not ready |
