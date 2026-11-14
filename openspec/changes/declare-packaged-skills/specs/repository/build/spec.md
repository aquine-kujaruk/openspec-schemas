## ADDED Requirements

### Requirement: A package declares the skills of its tools instead of carrying them

For each skill a package's manifest takes from one of its tools, the built package SHALL declare that skill for the agent package manager to install: the folder of the skill in the tool's repository, at the tag of the version the manifest pins for that tool. The built package SHALL hold no copy of the skill. When the tool does not say where its repository is, the build SHALL fail naming the tool and the skill and SHALL leave no built package.

#### Scenario Outline: the skill `<skill>` of `<tool>` at `<version>` is declared as `<dependency>`

- **GIVEN** a package manifest `<package>` listing the schemas `<listed>` <!-- manifestListingSchemas -->
- **AND** the manifest pins `<tool>` at `<version>` <!-- manifestPinsTool -->
- **AND** the manifest takes the skill `<skill>` from `<tool>`, whose repository is `<repository>` <!-- manifestTakesSkillFromTool -->
- **WHEN** the package `<package>` is built <!-- buildPackage -->
- **THEN** the built package declares the dependency `<dependency>` <!-- builtPackageDeclares -->
- **AND** it holds `<copies>` copy(ies) of the skill `<skill>` <!-- skillCopiesHeld -->

##### Examples:

  | package | listed        | tool               | version | skill          | repository           | dependency                                      | copies |
  | ------- | ------------- | ------------------ | ------- | -------------- | -------------------- | ----------------------------------------------- | ------ |
  | backend | clean-backend | specification tool | 2.0.0   | spec-writing   | acme/specification   | acme/specification/skills/spec-writing#v2.0.0   | 0      |
  | backend | clean-backend | linter             | 1.93.0  | lint-reading   | acme/linter          | acme/linter/skills/lint-reading#v1.93.0         | 0      |

#### Scenario Outline: a skill taken from `<tool>`, which names no repository, stops the build

- **GIVEN** a package manifest `<package>` listing the schemas `<listed>` <!-- manifestListingSchemas -->
- **AND** the manifest pins `<tool>` at `<version>` <!-- manifestPinsTool -->
- **AND** the manifest takes the skill `<skill>` from `<tool>`, whose repository is `<repository>` <!-- manifestTakesSkillFromTool -->
- **WHEN** the package `<package>` is built <!-- buildPackage -->
- **THEN** the build fails naming `<name>` <!-- buildFailsNaming -->
- **AND** `<builtPackages>` built package(s) called `<package>` exist <!-- builtPackagesCalled -->

##### Examples:

  | package | listed        | tool   | version | skill        | repository | name         | builtPackages |
  | ------- | ------------- | ------ | ------- | ------------ | ---------- | ------------ | ------------- |
  | backend | clean-backend | linter | 1.93.0  | lint-reading | none       | lint-reading | 0       |
