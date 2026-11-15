## MODIFIED Requirements

### Requirement: The implementer declares its workstreams and their dependencies

Every workstream SHALL declare its layers in the `workstream.ts` of its folder, `workstreams/<workstream>/` under the schema that names it or under the core that lists it, and the configuration's `workstreams` section SHALL list every workstream with the workstreams it depends on. Loading the implementer SHALL fail, naming the workstreams involved, when the configuration and the folders disagree, when a dependency names no declared workstream, or when the dependencies form a cycle.

#### Scenario Outline: a dependency on the unknown workstream `<dependency>` is rejected

- **GIVEN** workstream `<workstream>` depends on `<dependency>` <!-- workstreamDependsOn -->
- **AND** no workstream is named `<dependency>` <!-- noWorkstreamNamed -->
- **WHEN** the implementer is loaded <!-- implementerLoaded -->
- **THEN** loading fails naming `<workstream>` and `<dependency>` <!-- loadingFailsNaming -->

##### Examples:

  | workstream | dependency |
  | ---------- | ---------- |
  | integrate  | moduls     |

#### Scenario Outline: the workstream folder `<workstream>` missing from the configuration is rejected

- **GIVEN** the folder of workstream `<workstream>` exists <!-- workstreamFolderExists -->
- **AND** the configuration's `workstreams` section does not list `<workstream>` <!-- configurationOmitsWorkstream -->
- **WHEN** the implementer is loaded <!-- implementerLoaded -->
- **THEN** loading fails naming workstream `<workstream>` <!-- loadingFailsNamingWorkstream -->

##### Examples:

  | workstream |
  | ---------- |
  | adapters   |

#### Scenario Outline: workstreams `<workstream>` and `<dependency>` that depend on each other are rejected

- **GIVEN** workstreams `<workstream>` and `<dependency>` depend on each other <!-- mutualDependency -->
- **WHEN** the implementer is loaded <!-- implementerLoaded -->
- **THEN** loading fails naming the cycle `<cycle>` <!-- loadingFailsNamingCycle -->

##### Examples:

  | workstream | dependency | cycle                         |
  | ---------- | ---------- | ----------------------------- |
  | modules    | integrate  | modules → integrate → modules |

### Requirement: Workstreams run in dependency order

A workstream SHALL start only after every workstream it depends on in the configured topology has finished. Workstreams with no dependency path between them MAY run at the same time.

#### Scenario Outline: `<workstream>` waits for `<dependency>`

- **GIVEN** the default workstreams of the implementer <!-- defaultWorkstreams -->
- **WHEN** the implementer orders them for a change <!-- workstreamsOrdered -->
- **THEN** `<workstream>` starts only after `<dependency>` has finished <!-- startsAfter -->

##### Examples:

  | workstream | dependency     |
  | ---------- | -------------- |
  | modules    | app-domain     |
  | modules    | infrastructure |
  | modules    | adapters       |
  | integrate  | modules        |

#### Scenario Outline: `<workstream>` and `<other>` may run at the same time

- **GIVEN** the default workstreams of the implementer <!-- defaultWorkstreams -->
- **WHEN** the implementer orders them for a change <!-- workstreamsOrdered -->
- **THEN** `<workstream>` and `<other>` may run at the same time <!-- mayRunTogether -->

##### Examples:

  | workstream     | other          |
  | -------------- | -------------- |
  | app-domain     | infrastructure |
  | infrastructure | adapters       |

#### Scenario Outline: a project configuration in sequence makes `<workstream>` wait for `<dependency>`

- **GIVEN** the project configuration chains the workstreams `<sequence>` <!-- projectChainsWorkstreams -->
- **WHEN** the implementer orders them for a change <!-- workstreamsOrdered -->
- **THEN** `<workstream>` starts only after `<dependency>` has finished <!-- startsAfter -->

##### Examples:

  | sequence                                                 | workstream     | dependency     |
  | -------------------------------------------------------- | -------------- | -------------- |
  | app-domain, infrastructure, adapters, modules, integrate | infrastructure | app-domain     |
  | app-domain, infrastructure, adapters, modules, integrate | adapters       | infrastructure |

### Requirement: Every layer belongs to exactly one workstream

Every layer of the architecture SHALL be owned by exactly one workstream. Loading the implementer SHALL fail, naming the layer, when no workstream or more than one workstream claims it.

#### Scenario Outline: layer `<layer>` claimed by `<claimants>` is rejected

- **GIVEN** layer `<layer>` is claimed by `<claimants>` <!-- layerClaimedBy -->
- **WHEN** the implementer is loaded <!-- implementerLoaded -->
- **THEN** loading fails naming layer `<layer>` <!-- loadingFailsNamingLayer -->

##### Examples:

  | layer   | claimants                  |
  | ------- | -------------------------- |
  | domain  | app-domain, infrastructure |
  | modules | no workstream              |

#### Scenario Outline: layer `<layer>` belongs to `<workstream>`

- **GIVEN** the default workstreams of the implementer <!-- defaultWorkstreams -->
- **WHEN** the owner of layer `<layer>` is looked up <!-- layerOwnerLookedUp -->
- **THEN** its owner is workstream `<workstream>` <!-- layerOwner -->

##### Examples:

  | layer          | workstream     |
  | -------------- | -------------- |
  | acceptance     | app-domain     |
  | application    | app-domain     |
  | domain         | app-domain     |
  | infrastructure | infrastructure |
  | adapters       | adapters       |
  | modules        | modules        |

### Requirement: A workstream folder holds everything its agent reads

For every layer a workstream owns, the workstream's folder (`workstreams/<workstream>/` under its schema or under its core) SHALL hold that layer's rules (`<layer>.rules.ts`), examples (`<layer>.examples.md`), step adapter (`<layer>.feature.steps.ts`) and generated tests (`<layer>.feature.test.ts`). Every workstream folder SHALL hold the workstream's declaration (`workstream.ts`) and its skill (`SKILL.md`). This repository's tests SHALL fail naming the path of a missing file.

#### Scenario Outline: `<path>` is missing

- **GIVEN** workstream `<workstream>` owns layer `<layer>` <!-- workstreamOwnsLayer -->
- **AND** its folder lacks `<file>` <!-- folderLacks -->
- **WHEN** this repository's tests run <!-- archTestRuns -->
- **THEN** it fails naming `<path>` <!-- failsNamingPath -->

##### Examples:

  | workstream | layer  | file               | path                                                                      |
  | ---------- | ------ | ------------------ | ------------------------------------------------------------------------- |
  | app-domain | domain | domain.examples.md | schemas/shared/cores/clean-core/workstreams/app-domain/domain.examples.md |

#### Scenario Outline: workstream `<workstream>` without a skill

- **GIVEN** workstream `<workstream>` has no skill in its folder <!-- workstreamWithoutSkill -->
- **WHEN** this repository's tests run <!-- archTestRuns -->
- **THEN** it fails naming `<path>` <!-- failsNamingPath -->

##### Examples:

  | workstream | path                                                           |
  | ---------- | -------------------------------------------------------------- |
  | integrate  | schemas/shared/cores/clean-core/workstreams/integrate/SKILL.md |

### Requirement: A workstream can be checked alone

`factory check --workstream <workstream> [--module <module>]` SHALL evaluate the rules of the layers that workstream owns, its own whole-product rules and the checks of every workstream it depends on, transitively, and no other rule. When a module is given, it SHALL report only files of that module. When the workstream is unknown, it SHALL exit with status 2 and list the declared workstreams.

#### Scenario Outline: `<workstream>` evaluates `<rule>`

- **GIVEN** the default workstreams of the implementer <!-- defaultWorkstreams -->
- **WHEN** `factory check --workstream <workstream>` runs <!-- workstreamCheckRuns -->
- **THEN** rule `<rule>` is evaluated <!-- ruleEvaluated -->

##### Examples:

  | workstream     | rule                         |
  | -------------- | ---------------------------- |
  | app-domain     | entity-validates-with-schema |
  | infrastructure | repository-depends-on-acl    |
  | adapters       | adapter-implements-acl       |
  | modules        | modules-are-isolated         |
  | modules        | entity-validates-with-schema |
  | integrate      | no-unused-files              |

#### Scenario Outline: `<workstream>` leaves `<rule>` out

- **GIVEN** the default workstreams of the implementer <!-- defaultWorkstreams -->
- **WHEN** `factory check --workstream <workstream>` runs <!-- workstreamCheckRuns -->
- **THEN** rule `<rule>` is not evaluated <!-- ruleNotEvaluated -->

##### Examples:

  | workstream     | rule                            |
  | -------------- | ------------------------------- |
  | app-domain     | repository-implements-interface |
  | infrastructure | use-case-is-class-with-execute  |
  | infrastructure | adapter-implements-acl          |
  | adapters       | repository-depends-on-acl       |

#### Scenario Outline: `<workstream>` checked on module `<module>`

- **WHEN** `factory check --workstream <workstream> --module <module>` runs <!-- workstreamCheckRunsOnModule -->
- **THEN** only files of module `<module>` are reported <!-- filesReportedOfModule -->

##### Examples:

  | workstream | module  |
  | ---------- | ------- |
  | app-domain | billing |

#### Scenario Outline: the unknown workstream `<workstream>`

- **WHEN** `factory check --workstream <workstream>` runs <!-- workstreamCheckRuns -->
- **THEN** it exits with status `<status>` listing `<declared>` <!-- exitsListing -->

##### Examples:

  | workstream | status | declared                                                 |
  | ---------- | ------ | -------------------------------------------------------- |
  | nothing    | 2      | app-domain, infrastructure, adapters, modules, integrate |

## ADDED Requirements

### Requirement: A schema picks the platform whose globals are the environment

The defaults of a schema SHALL name one platform, and the globals that platform lists SHALL be the environment the rules keep out of every layer that may not reach it. The command SHALL know the platforms `node` and `web`, and a project configuration MAY name either.

#### Scenario Outline: on the platform `<platform>` the global `<global>` is `<environment>`

- **GIVEN** a schema whose platform is `<platform>` <!-- schemaPlatform -->
- **WHEN** the environment rules are composed <!-- environmentRulesComposed -->
- **THEN** the global `<global>` is `<environment>` <!-- globalIsEnvironment -->

##### Examples:

  | platform | global   | environment                 |
  | -------- | -------- | --------------------------- |
  | node     | process  | part of the environment     |
  | web      | document | part of the environment     |
  | web      | process  | not part of the environment |
  | node     | document | not part of the environment |
