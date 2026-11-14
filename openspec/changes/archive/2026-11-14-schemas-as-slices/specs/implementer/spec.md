## MODIFIED Requirements

### Requirement: The implementer declares its workstreams and their dependencies

Every workstream SHALL declare its layers in `schemas/<schema>/workstreams/<workstream>/workstream.ts`, and the configuration's `workstreams` section SHALL list every workstream with the workstreams it depends on. Loading the implementer SHALL fail, naming the workstreams involved, when the configuration and the folders disagree, when a dependency names no declared workstream, or when the dependencies form a cycle.

#### Scenario Outline: a dependency on the unknown workstream `<dependency>` is rejected

- **GIVEN** workstream `<workstream>` depends on `<dependency>` <!-- workstreamDependsOn -->
- **AND** no workstream is named `<dependency>` <!-- noWorkstreamNamed -->
- **WHEN** the implementer is loaded <!-- implementerLoaded -->
- **THEN** loading fails naming `<workstream>` and `<dependency>` <!-- loadingFailsNaming -->

##### Examples:

  | workstream | dependency         |
  | ---------- | ------------------ |
  | integrate  | clean-architecure  |

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

  | workstream         | dependency | cycle                                                 |
  | ------------------ | ---------- | ----------------------------------------------------- |
  | clean-architecture | integrate  | clean-architecture → integrate → clean-architecture   |

### Requirement: A workstream folder holds everything its agent reads

For every layer a workstream owns, the folder `schemas/<schema>/workstreams/<workstream>/` SHALL hold that layer's rules (`<layer>.rules.ts`), examples (`<layer>.examples.md`), step adapter (`<layer>.feature.steps.ts`) and generated tests (`<layer>.feature.test.ts`). Every workstream folder SHALL hold the workstream's declaration (`workstream.ts`) and its skill (`SKILL.md`). This repository's tests SHALL fail naming the path of a missing file.

#### Scenario Outline: `<path>` is missing

- **GIVEN** workstream `<workstream>` owns layer `<layer>` <!-- workstreamOwnsLayer -->
- **AND** its folder lacks `<file>` <!-- folderLacks -->
- **WHEN** this repository's tests run <!-- archTestRuns -->
- **THEN** it fails naming `<path>` <!-- failsNamingPath -->

##### Examples:

  | workstream  | layer     | file                        | path                                                                     |
  | ----------- | --------- | --------------------------- | ------------------------------------------------------------------------ |
  | app-domain  | domain    | domain.examples.md          | schemas/clean-backend/workstreams/app-domain/domain.examples.md           |

#### Scenario Outline: workstream `<workstream>` without a skill

- **GIVEN** workstream `<workstream>` has no skill in its folder <!-- workstreamWithoutSkill -->
- **WHEN** this repository's tests run <!-- archTestRuns -->
- **THEN** it fails naming `<path>` <!-- failsNamingPath -->

##### Examples:

  | workstream | path                                              |
  | ---------- | ------------------------------------------------- |
  | integrate  | schemas/clean-backend/workstreams/integrate/SKILL.md |

### Requirement: Project configuration overrides the implementer's defaults

The implementer SHALL read its defaults from the definition of the schema (`schemas/<schema>/schema.ts`). When the repository root holds `factory.config.ts`, the implementer SHALL apply that file over the defaults:

- a value the file sets SHALL replace the default
- a section the file sets SHALL be merged key by key
- a value the file leaves out SHALL keep its default

#### Scenario Outline: the project sets `<setting>` to `<override>`

- **GIVEN** the default of `<setting>` is `<default>` <!-- settingDefault -->
- **AND** the project configuration sets `<setting>` to `<override>` <!-- projectSets -->
- **WHEN** the configuration is resolved <!-- configurationResolved -->
- **THEN** `<setting>` is `<resolved>` <!-- settingResolved -->

##### Examples:

  | setting          | default | override | resolved |
  | ---------------- | ------- | -------- | -------- |
  | modules          | src/*   | src/v3/* | src/v3/* |
  | review.threshold | 0.85    | 0.9      | 0.9      |

#### Scenario Outline: `<setting>` keeps its default when the project sets only `<changed>`

- **GIVEN** the default of `<setting>` is `<default>` <!-- settingDefault -->
- **AND** the project configuration sets only `<changed>` to `<override>` <!-- projectSetsOnly -->
- **WHEN** the configuration is resolved <!-- configurationResolved -->
- **THEN** `<setting>` keeps its default `<default>` <!-- settingKeepsDefault -->

##### Examples:

  | setting          | default | changed          | override |
  | ---------------- | ------- | ---------------- | -------- |
  | review.spanLines | 40      | review.threshold | 0.9      |

#### Scenario Outline: without a project configuration `<setting>` is `<default>`

- **GIVEN** the default of `<setting>` is `<default>` <!-- settingDefault -->
- **AND** the repository root holds no project configuration <!-- noProjectConfiguration -->
- **WHEN** the configuration is resolved <!-- configurationResolved -->
- **THEN** `<setting>` keeps its default `<default>` <!-- settingKeepsDefault -->

##### Examples:

  | setting | default |
  | ------- | ------- |
  | modules | src/*   |
