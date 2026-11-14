## ADDED Requirements

### Requirement: The command's own tests are generated from its specs as ready changes leave them

In the repository the command is developed in, generation SHALL write the tests of each spec as that spec will stand once the changes validation reports ready are archived, so that a delta spec of a ready change has its tests without being copied into the consolidated specs.

#### Scenario Outline: a `<readiness>` change adding `<added>` scenario(s) to `<spec>` leaves `<generated>` generated for it

- **GIVEN** the command's repository with `<standing>` scenario(s) in the spec `<spec>` <!-- repositorySpecWithScenarios -->
- **AND** a `<readiness>` change whose delta adds `<added>` scenario(s) to `<spec>` <!-- changeAddingScenarios -->
- **WHEN** the tests are generated <!-- generateTests -->
- **THEN** `<generated>` scenario(s) are generated for `<spec>` <!-- scenariosGeneratedFor -->

##### Examples:

  | standing | readiness | added | spec        | generated |
  | -------- | --------- | ----- | ----------- | --------- |
  | 2        | ready     | 1     | flow/verify | 3         |
  | 2        | not ready | 1     | flow/verify | 2         |
