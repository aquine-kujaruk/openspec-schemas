# flow/reading Specification

## Purpose
Reading a change's artifacts and the consolidated trees in the person's language: the project or the person names a language, and every artifact shown to the person gets a translated copy outside the repository, while the repository stays in English.

## Requirements

### Requirement: An artifact to show gets a reading copy outside the repository

`@by:person`

Asked where to read artifacts of `openspec/` while a language is configured, the command SHALL name, for each one, a copy in that language under the system's temporary folder, and SHALL report it stale when it is missing or the artifact changed since the copy was written, and fresh otherwise. It SHALL never name a copy inside the repository.

#### Scenario Outline: the reading copy of `<artifact>`, `<state>`, is reported `<freshness>`

- **GIVEN** a project whose configured language is `<project>` <!-- projectLanguage -->
- **AND** a person whose environment names the language `<person>` <!-- personLanguage -->
- **AND** the artifact `<artifact>`, whose copy is `<state>` <!-- artifactWithCopy -->
- **WHEN** the reading copies of `<artifact>` are asked for <!-- askReadingCopies -->
- **THEN** the command names `<copy>` <!-- commandNamesCopy -->
- **AND** the copy is reported `<freshness>` <!-- copyReported -->

##### Examples:

  | artifact                            | state                               | freshness | project | person | copy                                |
  | ----------------------------------- | ----------------------------------- | --------- | ------- | ------ | ----------------------------------- |
  | openspec/changes/add-orders/plan.md | missing                             | stale     | es      | none   | a copy in es outside the repository |
  | openspec/changes/add-orders/plan.md | written after the artifact          | fresh     | es      | none   | a copy in es outside the repository |
  | openspec/changes/add-orders/plan.md | written before the artifact changed | stale     | es      | none   | a copy in es outside the repository |
  | openspec/adr/product/money.md       | missing                             | stale     | es      | none   | a copy in es outside the repository |

### Requirement: The person's language overrides the project's

`@by:agent`

The language the person's environment names SHALL override the one the project configures. With no language from either, or with English, the command SHALL name no copy, so the artifacts are shown as they are.

#### Scenario Outline: the language `<project>` of the project and `<person>` of the person names `<copy>`

- **GIVEN** a project whose configured language is `<project>` <!-- projectLanguage -->
- **AND** a person whose environment names the language `<person>` <!-- personLanguage -->
- **AND** the artifact `<artifact>`, whose copy is `<state>` <!-- artifactWithCopy -->
- **WHEN** the reading copies of `<artifact>` are asked for <!-- askReadingCopies -->
- **THEN** the command names `<copy>` <!-- commandNamesCopy -->

##### Examples:

  | project | person | copy                                | state   | artifact                           |
  | ------- | ------ | ----------------------------------- | ------- | ---------------------------------- |
  | es      | none   | a copy in es outside the repository | missing | openspec/specs/orders/list/spec.md |
  | none    | pt     | a copy in pt outside the repository | missing | openspec/specs/orders/list/spec.md |
  | es      | pt     | a copy in pt outside the repository | missing | openspec/specs/orders/list/spec.md |
  | none    | none   | no copy                             | missing | openspec/specs/orders/list/spec.md |
  | en      | none   | no copy                             | missing | openspec/specs/orders/list/spec.md |

### Requirement: Only what the specification tool keeps gets a reading copy

`@by:agent`

The command SHALL name reading copies only for files under `openspec/`, and SHALL exit with status 1, naming the file, when asked for any other.

#### Scenario Outline: asking a reading copy of `<artifact>` exits with `<status>`

- **GIVEN** a project whose configured language is `<project>` <!-- projectLanguage -->
- **AND** a person whose environment names the language `<person>` <!-- personLanguage -->
- **AND** the artifact `<artifact>`, whose copy is `<state>` <!-- artifactWithCopy -->
- **WHEN** the reading copies of `<artifact>` are asked for <!-- askReadingCopies -->
- **THEN** the command exits with status `<status>` <!-- readingExitStatus -->

##### Examples:

  | artifact                            | status | project | person | state   |
  | ----------------------------------- | ------ | ------- | ------ | ------- |
  | openspec/changes/add-orders/plan.md | 0      | es      | none   | missing |
  | src/orders/order.ts                 | 1      | es      | none   | missing |
  | README.md                           | 1      | es      | none   | missing |
