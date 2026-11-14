## Purpose

Building a package: the repository holds resources by kind, a schema definition picks the resources one schema uses, a package manifest lists the schemas one package carries, and the build turns a manifest into what a project installs.

## ADDED Requirements

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

A schema definition SHALL name its workstreams, its validator and its question policy. When a definition names a resource that does not exist, the build SHALL fail naming that resource and SHALL leave no built package.

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

  | package | resource                        | state     | freshness |
  | ------- | ------------------------------- | --------- | --------- |
  | backend | workstreams/app-domain/SKILL.md | unchanged | fresh     |
  | backend | workstreams/app-domain/SKILL.md | edited    | stale     |
  | backend | questions/ask-on-commitment.md  | edited    | stale     |

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
