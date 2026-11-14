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

A schema definition SHALL name its validator and its question policy and MAY name workstreams. The build SHALL look for each resource a definition names in the definition's own folder, then in the folder of each definition it extends, then in the shared folder. When a definition names a resource that is in none of them, the build SHALL fail naming that resource and SHALL leave no built package.

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

A resource SHALL be held in the folder of the definition that names it. A resource named by a definition and by the definitions that extend it SHALL be held in the folder of the one they extend. A resource named by two definitions neither of which extends the other SHALL be held in the shared folder. The build SHALL fail, naming the resource and the folder it belongs in, when a resource is held anywhere else.

#### Scenario Outline: the `<kind>` `<name>` held in `<held>` is accepted when `<relation>`

- **GIVEN** a package manifest `<package>` listing the schemas `<listed>` <!-- manifestListingSchemas -->
- **AND** the definitions `<listed>` name the `<kind>` `<name>`, and `<relation>` <!-- definitionsNameResourceAnd -->
- **AND** the `<kind>` `<name>` is held in the folder `<held>` <!-- resourceHeldIn -->
- **WHEN** the package `<package>` is built <!-- buildPackage -->
- **THEN** `<builtPackages>` built package(s) called `<package>` exist <!-- builtPackagesCalled -->

##### Examples:

  | package | listed                        | kind       | name       | relation                        | held          | builtPackages |
  | ------- | ----------------------------- | ---------- | ---------- | ------------------------------- | ------------- | ------------- |
  | backend | spec-plan, clean-backend      | validator  | standard   | clean-backend extends spec-plan | spec-plan     | 1             |
  | backend | clean-backend                 | workstream | app-domain | no other definition names it    | clean-backend | 1             |
  | both    | clean-backend, clean-frontend | workstream | app-domain | neither extends the other       | shared        | 1             |

#### Scenario Outline: the `<kind>` `<name>` held in `<held>` is refused when `<relation>`

- **GIVEN** a package manifest `<package>` listing the schemas `<listed>` <!-- manifestListingSchemas -->
- **AND** the definitions `<listed>` name the `<kind>` `<name>`, and `<relation>` <!-- definitionsNameResourceAnd -->
- **AND** the `<kind>` `<name>` is held in the folder `<held>` <!-- resourceHeldIn -->
- **WHEN** the package `<package>` is built <!-- buildPackage -->
- **THEN** the build fails naming `<name>` <!-- buildFailsNaming -->
- **AND** the failure says it belongs in the folder `<belongs>` <!-- failureSaysBelongsIn -->

##### Examples:

  | package | listed                        | kind       | name       | relation                        | held          | belongs   |
  | ------- | ----------------------------- | ---------- | ---------- | ------------------------------- | ------------- | --------- |
  | backend | spec-plan, clean-backend      | validator  | standard   | clean-backend extends spec-plan | shared        | spec-plan |
  | both    | clean-backend, clean-frontend | workstream | app-domain | neither extends the other       | clean-backend | shared    |
