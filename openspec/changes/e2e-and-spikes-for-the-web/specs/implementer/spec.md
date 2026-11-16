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
  | modules    | adaptres   |

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
  | adapters   | modules    | adapters → modules → adapters |


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
  | app-domain, infrastructure, adapters, modules            | infrastructure | app-domain     |
  | app-domain, infrastructure, adapters, modules            | adapters       | infrastructure |


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
  | modules    | schemas/shared/cores/clean-core/workstreams/modules/SKILL.md   |


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
  | nothing    | 2      | app-domain, infrastructure, adapters, modules            |


### Requirement: A schema's own workstreams join its core's in one topology

The workstreams a schema adds SHALL be ordered together with the workstreams of its core: each one waits for the workstreams the schema's defaults name, and a workstream of the core waits, besides its own dependencies, for the ones the schema adds to it. Every layer a schema adds SHALL be owned by exactly one of the schema's own workstreams.

#### Scenario Outline: in `<schema>`, `<workstream>` waits for `<dependency>`

- **GIVEN** the default workstreams of the schema `<schema>` <!-- defaultWorkstreamsOfSchema -->
- **WHEN** the implementer orders them for a change <!-- workstreamsOrdered -->
- **THEN** `<workstream>` starts only after `<dependency>` has finished <!-- startsAfter -->

##### Examples:

  | schema      | workstream  | dependency  |
  | ----------- | ----------- | ----------- |
  | clean-react | react-hooks | react-ui    |
  | clean-react | modules     | app-domain  |

#### Scenario Outline: in `<schema>`, `<workstream>` and `<other>` may run at the same time

- **GIVEN** the default workstreams of the schema `<schema>` <!-- defaultWorkstreamsOfSchema -->
- **WHEN** the implementer orders them for a change <!-- workstreamsOrdered -->
- **THEN** `<workstream>` and `<other>` may run at the same time <!-- mayRunTogether -->

##### Examples:

  | schema      | workstream | other          |
  | ----------- | ---------- | -------------- |
  | clean-react | react-ui   | app-domain     |
  | clean-react | react-ui   | infrastructure |
  | clean-react | react-ui   | adapters       |
  | clean-react | react-hooks | modules       |

#### Scenario Outline: in `<schema>`, layer `<layer>` belongs to `<workstream>`

- **GIVEN** the default workstreams of the schema `<schema>` <!-- defaultWorkstreamsOfSchema -->
- **WHEN** the owner of layer `<layer>` is looked up <!-- layerOwnerLookedUp -->
- **THEN** its owner is workstream `<workstream>` <!-- layerOwner -->

##### Examples:

  | schema      | layer     | workstream  |
  | ----------- | --------- | ----------- |
  | clean-react | ui        | react-ui    |
  | clean-react | framework | react-hooks |
  | clean-react | domain    | app-domain  |
  | clean-react | modules   | modules     |

## ADDED Requirements

### Requirement: Whole-product checks belong to no workstream

The checks that only make sense once every workstream's work is joined (`no-unused-files`, `duplication-below-threshold`) SHALL belong to no workstream: `factory check --workstream <workstream>` SHALL NOT evaluate them, whatever the workstream, and `factory check` with no workstream SHALL evaluate them after every workstream's rules. A core SHALL NOT list a workstream that owns no layer.

#### Scenario Outline: `<command>` evaluates `<rule>` `<evaluated>`

- **GIVEN** the default workstreams of the implementer <!-- defaultWorkstreams -->
- **WHEN** `<command>` runs <!-- commandRuns -->
- **THEN** rule `<rule>` is evaluated `<evaluated>` <!-- ruleEvaluatedOrNot -->

##### Examples:

  | command                               | rule                        | evaluated |
  | ------------------------------------- | --------------------------- | --------- |
  | factory check --workstream modules    | no-unused-files             | no        |
  | factory check --workstream modules    | duplication-below-threshold | no        |
  | factory check                         | no-unused-files             | yes       |
  | factory check                         | duplication-below-threshold | yes       |

### Requirement: The end-to-end tests of a web product run through the command

`factory test e2e [--report <file>]` SHALL run the product's end-to-end tests (`test/e2e/**/*.e2e.ts` by default, the configured `e2e` root otherwise) with the pinned end-to-end tool, its telemetry off, and SHALL exit with the tool's status: 0 when every test passes, 1 when a test fails, and 2 when the run could not start (configuration, infrastructure or an internal error), naming the cause. A product whose platform is not `web` SHALL have no end-to-end tests: the command SHALL exit 2 saying so.

#### Scenario Outline: on a `<platform>` product, the tool exiting `<tool>` makes `factory test e2e` exit `<status>`

- **GIVEN** a product of platform `<platform>` with end-to-end tests <!-- productOfPlatformWithE2e -->
- **AND** the end-to-end tool exits with `<tool>` <!-- e2eToolExits -->
- **WHEN** `factory test e2e` runs <!-- e2eCommandRuns -->
- **THEN** it exits with status `<status>` <!-- e2eCommandExit -->

##### Examples:

  | platform | tool | status |
  | -------- | ---- | ------ |
  | web      | 0    | 0      |
  | web      | 1    | 1      |
  | web      | 2    | 2      |
  | web      | 3    | 2      |
  | node     | 0    | 2      |
