## ADDED Requirements

### Requirement: A built package's command offers only what a project runs

`@by:person`

The command a built package carries SHALL offer the commands a project runs and SHALL NOT carry or offer the commands only the repository of the packages runs: building and releasing packages, proving a package in an empty project, and recording what the examples of the rules report.

#### Scenario Outline: the command built into `<package>` offers `<command>` as `<presence>`

- **GIVEN** a package manifest `<package>` listing the schemas `<listed>` <!-- manifestListingSchemas -->
- **WHEN** the package `<package>` is built <!-- buildPackage -->
- **THEN** the built command offers `<command>` as `<presence>` <!-- builtCommandOffers -->

##### Examples:

  | package | listed                   | command  | presence |
  | ------- | ------------------------ | -------- | -------- |
  | backend | clean-backend, spec-plan | verify   | present  |
  | backend | clean-backend, spec-plan | check    | present  |
  | backend | clean-backend, spec-plan | guard    | present  |
  | backend | clean-backend, spec-plan | build    | absent   |
  | backend | clean-backend, spec-plan | release  | absent   |
  | backend | clean-backend, spec-plan | proof    | absent   |
  | backend | clean-backend, spec-plan | expect   | absent   |
