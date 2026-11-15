## ADDED Requirements

### Requirement: A package declares a skill that lives in a repository of its own

For each skill a package's manifest takes from a repository at a commit, the built package SHALL declare that skill for the agent package manager to install: the folder of the skill in that repository, at that commit. The built package SHALL hold no copy of the skill. When the manifest gives no commit, the build SHALL fail naming the skill and SHALL leave no built package.

#### Scenario Outline: the skill `<skill>` of the repository `<repository>` at `<commit>` is declared as `<dependency>`

- **GIVEN** a package manifest `<package>` listing the schemas `<listed>` <!-- manifestListingSchemas -->
- **AND** the manifest takes the skill `<skill>` from the repository `<repository>` at the commit `<commit>` <!-- manifestTakesSkillFromRepository -->
- **WHEN** the package `<package>` is built <!-- buildPackage -->
- **THEN** the built package declares the dependency `<dependency>` <!-- builtPackageDeclares -->
- **AND** it holds `<copies>` copy(ies) of the skill `<skill>` <!-- skillCopiesHeld -->

##### Examples:

  | package  | listed      | skill              | repository        | commit  | dependency                                          | copies |
  | -------- | ----------- | ------------------ | ----------------- | ------- | --------------------------------------------------- | ------ |
  | frontend | clean-react | component-patterns | acme/agent-skills | 1a2c79d | acme/agent-skills/skills/component-patterns#1a2c79d | 0      |
  | frontend | clean-react | interface-review   | acme/agent-skills | 1a2c79d | acme/agent-skills/skills/interface-review#1a2c79d   | 0      |

#### Scenario Outline: the skill `<skill>` taken from `<repository>` with no commit stops the build

- **GIVEN** a package manifest `<package>` listing the schemas `<listed>` <!-- manifestListingSchemas -->
- **AND** the manifest takes the skill `<skill>` from the repository `<repository>` at the commit `<commit>` <!-- manifestTakesSkillFromRepository -->
- **WHEN** the package `<package>` is built <!-- buildPackage -->
- **THEN** the build fails naming `<name>` <!-- buildFailsNaming -->
- **AND** `<builtPackages>` built package(s) called `<package>` exist <!-- builtPackagesCalled -->

##### Examples:

  | package  | listed      | skill              | repository        | commit | name               | builtPackages |
  | -------- | ----------- | ------------------ | ----------------- | ------ | ------------------ | ------------- |
  | frontend | clean-react | component-patterns | acme/agent-skills | none   | component-patterns | 0             |
