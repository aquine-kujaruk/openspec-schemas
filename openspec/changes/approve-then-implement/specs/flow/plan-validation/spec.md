## ADDED Requirements

### Requirement: Every decision names who took it

`@by:person`

Each line under the plan's Decisions, each architecture decision, procedure and screen of the plan, and each requirement a delta spec of the change adds or modifies SHALL carry exactly one of `@by:person` and `@by:agent`; a requirement carries it as the first line of its text. Validation SHALL report the change as not ready, naming the decision, while one carries neither, both, or another value.

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
  | architecture decision | money-in-cents    | none                  | not ready |
  | procedure             | prod-logs         | @by:agent             | ready     |
  | procedure             | prod-logs         | none                  | not ready |
  | screen                | orders-list       | @by:person            | ready     |
  | screen                | orders-list       | none                  | not ready |
  | added requirement     | Orders are listed | @by:agent             | ready     |
  | added requirement     | Orders are listed | none                  | not ready |
  | modified requirement  | Orders are listed | @by:person            | ready     |
  | modified requirement  | Orders are listed | none                  | not ready |

### Requirement: A change is ready only once the person approved its plan

`@by:agent`

The plan SHALL record the person's approval as `approved_at` in its front matter, valued with the date of the approval. Validation SHALL report the change as not ready, naming the approval, while the plan records none or records a value that is not a date.

#### Scenario Outline: a plan approved `<approved>` makes the change `<readiness>`

- **GIVEN** a change whose plan is approved `<approved>` <!-- planApproved -->
- **WHEN** the change is validated <!-- validateChange -->
- **THEN** the change is reported `<readiness>` <!-- changeReportedAs -->

##### Examples:

  | approved   | readiness |
  | ---------- | --------- |
  | 2026-11-17 | ready     |
  | none       | not ready |
  | yesterday  | not ready |
