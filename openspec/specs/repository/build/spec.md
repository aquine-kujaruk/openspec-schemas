# repository/build Specification

## Purpose

Building a package: the repository holds each schema in a folder of its own with the resources only it uses, and in a shared folder what unrelated schemas use and the flow every package carries. A schema definition names the resources one schema uses, a package manifest lists the schemas one package carries, and the build turns a manifest into what a project installs.

## Requirements

### Requirement: A package carries the schemas its manifest lists

The build SHALL emit, for the package it is asked for, one schema for each schema the package's manifest lists and no other schema. The phase skills SHALL be in the built package once, however many schemas it carries.

#### Scenario Outline: the built `<package>` holds the schema `<schema>` as `<presence>`

- **GIVEN** a package manifest `<package>` listing the schemas `<listed>` <!-- manifestListingSchemas -->
- **WHEN** the package `<package>` is built <!-- buildPackage -->
- **THEN** the built package holds the schema `<schema>` as `<presence>` <!-- builtSchemaPresence -->
- **AND** it holds each phase skill `<skillCopies>` time(s) <!-- phaseSkillCopies -->

##### Examples:

  | package | listed                         | schema          | presence | skillCopies |
  | ------- | ------------------------------ | --------------- | -------- | ----------- |
  | backend | clean-backend                  | clean-backend   | present  | 1           |
  | backend | clean-backend                  | legacy-to-specs | absent   | 1           |
  | both    | clean-backend, legacy-to-specs | legacy-to-specs | present  | 1           |

### Requirement: A schema definition names resources that exist

A schema definition SHALL name its validator and its question policy, MAY name one core and MAY name workstreams. The build SHALL look for a core among the cores of the shared folder. It SHALL look for every other resource a definition names in the definition's own folder, then in the folder of each definition it extends, then in the shared folder. When a definition names a resource that is in none of them, the build SHALL fail naming that resource and SHALL leave no built package.

#### Scenario Outline: a definition naming the missing `<kind>` `<name>` stops the build

- **GIVEN** a package manifest `<package>` listing the schemas `<listed>` <!-- manifestListingSchemas -->
- **AND** the definition of `<listed>` names the `<kind>` `<name>` <!-- definitionNamesResource -->
- **AND** no `<kind>` called `<name>` exists <!-- resourceDoesNotExist -->
- **WHEN** the package `<package>` is built <!-- buildPackage -->
- **THEN** the build fails naming `<name>` <!-- buildFailsNaming -->
- **AND** `<builtPackages>` built package(s) called `<package>` exist <!-- builtPackagesCalled -->

##### Examples:

  | package | listed        | kind            | name      | builtPackages |
  | ------- | ------------- | --------------- | --------- | ------------- |
  | backend | clean-backend | workstream      | billing   | 0             |
  | backend | clean-backend | validator       | strictest | 0             |
  | backend | clean-backend | question policy | never-ask | 0             |
  | backend | clean-backend | core            | onion     | 0             |

### Requirement: A variant differs only in what it overrides

A schema definition MAY extend another definition and override one of its resources. The built variant SHALL use the overriding resource and SHALL use, for every resource it does not override, the one its base uses.

#### Scenario Outline: `<variant>` overrides the `<kind>` of `<base>` and keeps its `<keptKind>`

- **GIVEN** a package manifest `<package>` listing the schemas `<listed>` <!-- manifestListingSchemas -->
- **AND** the definition `<variant>` extends `<base>` overriding its `<kind>` with `<override>` <!-- variantOverrides -->
- **WHEN** the package `<package>` is built <!-- buildPackage -->
- **THEN** the built schema `<variant>` uses the `<kind>` `<override>` <!-- builtSchemaUses -->
- **AND** the built schema `<variant>` uses the `<keptKind>` of `<base>` <!-- builtSchemaKeeps -->

##### Examples:

  | package  | listed                              | variant              | base          | kind            | override | keptKind        |
  | -------- | ----------------------------------- | -------------------- | ------------- | --------------- | -------- | --------------- |
  | variants | clean-backend, clean-backend-strict | clean-backend-strict | clean-backend | validator       | strict   | question policy |
  | variants | clean-backend, clean-backend-quiet  | clean-backend-quiet  | clean-backend | question policy | ask-less | validator       |

### Requirement: A built package is known to be fresh or stale

Building a package twice from the same resources SHALL give the same content. A freshness check SHALL report a built package as stale when any resource it was built from has changed since, and as fresh otherwise.

#### Scenario Outline: `<package>` is reported `<freshness>` when `<resource>` is `<state>`

- **GIVEN** the package `<package>` was built <!-- packageWasBuilt -->
- **AND** the resource `<resource>` is `<state>` since that build <!-- resourceStateSinceBuild -->
- **WHEN** the freshness of `<package>` is checked <!-- checkFreshness -->
- **THEN** the package is reported `<freshness>` <!-- packageReportedAs -->

##### Examples:

  | package | resource                                                | state     | freshness |
  | ------- | ------------------------------------------------------- | --------- | --------- |
  | backend | schemas/clean-backend/workstreams/app-domain/SKILL.md   | unchanged | fresh     |
  | backend | schemas/clean-backend/workstreams/app-domain/SKILL.md   | edited    | stale     |
  | backend | schemas/spec-plan/questions/ask-on-commitment.md        | edited    | stale     |
  | backend | schemas/shared/phases/plan/SKILL.md                     | edited    | stale     |

### Requirement: A built package pins every tool it runs

A built package SHALL run each tool at the one exact version its manifest pins, the specification tool included, so that changing the version of a tool means building a new version of the package.

#### Scenario Outline: the built `<package>` runs `<tool>` at exactly `<version>`

- **GIVEN** a package manifest `<package>` listing the schemas `<listed>` <!-- manifestListingSchemas -->
- **AND** the manifest pins `<tool>` at `<version>` <!-- manifestPinsTool -->
- **WHEN** the package `<package>` is built <!-- buildPackage -->
- **THEN** the built package runs `<tool>` at exactly `<version>` <!-- builtToolVersion -->

##### Examples:

  | package | listed        | tool               | version |
  | ------- | ------------- | ------------------ | ------- |
  | backend | clean-backend | specification tool | 2.0.0   |
  | backend | clean-backend | linter             | 1.93.0  |

### Requirement: A resource is held where the definitions naming it put it

A resource SHALL be held in the folder of the definition that names it. A resource named by a definition and by the definitions that extend it SHALL be held in the folder of the one they extend. A resource named by two definitions neither of which extends the other SHALL be held in the shared folder. A workstream a core lists SHALL be held in that core's folder, `cores/<core>` of the shared folder. The build SHALL fail, naming the resource and the folder it belongs in, when a resource is held anywhere else.

#### Scenario Outline: the `<kind>` `<name>` held in `<held>` is accepted when `<relation>`

- **GIVEN** a package manifest `<package>` listing the schemas `<listed>` <!-- manifestListingSchemas -->
- **AND** the definitions `<listed>` name the `<kind>` `<name>`, and `<relation>` <!-- definitionsNameResourceAnd -->
- **AND** the `<kind>` `<name>` is held in the folder `<held>` <!-- resourceHeldIn -->
- **WHEN** the package `<package>` is built <!-- buildPackage -->
- **THEN** `<builtPackages>` built package(s) called `<package>` exist <!-- builtPackagesCalled -->

##### Examples:

  | package | listed                     | kind       | name       | relation                         | held                    | builtPackages |
  | ------- | -------------------------- | ---------- | ---------- | -------------------------------- | ----------------------- | ------------- |
  | backend | spec-plan, clean-backend   | validator  | standard   | clean-backend extends spec-plan  | spec-plan               | 1             |
  | backend | clean-backend              | workstream | delivery   | no other definition names it     | clean-backend           | 1             |
  | both    | clean-backend, clean-react | workstream | reporting  | neither extends the other        | shared                  | 1             |
  | both    | clean-backend, clean-react | workstream | app-domain | the core they both name lists it | shared/cores/clean-core | 1             |

#### Scenario Outline: the `<kind>` `<name>` held in `<held>` is refused when `<relation>`

- **GIVEN** a package manifest `<package>` listing the schemas `<listed>` <!-- manifestListingSchemas -->
- **AND** the definitions `<listed>` name the `<kind>` `<name>`, and `<relation>` <!-- definitionsNameResourceAnd -->
- **AND** the `<kind>` `<name>` is held in the folder `<held>` <!-- resourceHeldIn -->
- **WHEN** the package `<package>` is built <!-- buildPackage -->
- **THEN** the build fails naming `<name>` <!-- buildFailsNaming -->
- **AND** the failure says it belongs in the folder `<belongs>` <!-- failureSaysBelongsIn -->

##### Examples:

  | package | listed                     | kind       | name       | relation                         | held          | belongs                 |
  | ------- | -------------------------- | ---------- | ---------- | -------------------------------- | ------------- | ----------------------- |
  | backend | spec-plan, clean-backend   | validator  | standard   | clean-backend extends spec-plan  | shared        | spec-plan               |
  | both    | clean-backend, clean-react | workstream | reporting  | neither extends the other        | clean-backend | shared                  |
  | both    | clean-backend, clean-react | workstream | app-domain | the core they both name lists it | clean-backend | shared/cores/clean-core |
  | both    | clean-backend, clean-react | workstream | app-domain | the core they both name lists it | shared        | shared/cores/clean-core |

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

### Requirement: A schema builds through the workstreams of its core and its own

`@by:person`

A core SHALL list its workstreams and, for each one, the workstreams it waits for. A schema that names a core SHALL build through the core's workstreams followed by the workstreams its own definition names. Its definition MAY say what each of its own workstreams waits for, and MAY add to what a workstream of the core waits for. The build SHALL fail naming the workstream when a definition names one its core already lists.

#### Scenario Outline: `<listed>` naming the core `<core>` and its own `<own>` builds through `<workstreams>`

- **GIVEN** a package manifest `<package>` listing the schemas `<listed>` <!-- manifestListingSchemas -->
- **AND** the core `<core>` lists the workstreams `<coreWorkstreams>` <!-- coreListsWorkstreams -->
- **AND** the definition of `<listed>` names the core `<core>` and the workstreams `<own>` <!-- definitionNamesCoreAndWorkstreams -->
- **WHEN** the package `<package>` is built <!-- buildPackage -->
- **THEN** the built schema `<listed>` lets a task name `<workstreams>` <!-- builtSchemaLetsTaskName -->

##### Examples:

  | package  | listed        | core       | coreWorkstreams                                          | own                   | workstreams                                                                     |
  | -------- | ------------- | ---------- | -------------------------------------------------------- | --------------------- | ------------------------------------------------------------------------------- |
  | backend  | clean-backend | clean-core | app-domain, infrastructure, adapters, modules            | none                  | app-domain, infrastructure, adapters, modules                                   |
  | frontend | clean-react   | clean-core | app-domain, infrastructure, adapters, modules            | react                 | app-domain, infrastructure, adapters, modules, react                            |

#### Scenario Outline: `<listed>` naming `<name>`, which its core `<core>` already lists, stops the build

- **GIVEN** a package manifest `<package>` listing the schemas `<listed>` <!-- manifestListingSchemas -->
- **AND** the core `<core>` lists the workstreams `<coreWorkstreams>` <!-- coreListsWorkstreams -->
- **AND** the definition of `<listed>` names the core `<core>` and the workstreams `<own>` <!-- definitionNamesCoreAndWorkstreams -->
- **WHEN** the package `<package>` is built <!-- buildPackage -->
- **THEN** the build fails naming `<name>` <!-- buildFailsNaming -->
- **AND** `<builtPackages>` built package(s) called `<package>` exist <!-- builtPackagesCalled -->

##### Examples:

  | package | listed        | core       | coreWorkstreams                                          | own     | name    | builtPackages |
  | ------- | ------------- | ---------- | -------------------------------------------------------- | ------- | ------- | ------------- |
  | backend | clean-backend | clean-core | app-domain, infrastructure, adapters, modules            | modules | modules | 0             |

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
