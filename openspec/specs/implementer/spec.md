# implementer Specification

## Purpose

The implementer of a schema: the phase that generates the product's code and checks it while generating. It is split into workstreams, units of change that can be built and tested in isolation. Which workstream waits for which is configuration. By default, map workstreams run in parallel and reduce workstreams integrate the ones they depend on, and a project may chain them in sequence instead. Each workstream owns the rules, examples, step adapters, generated tests and skill of its layers. The implementer reads the dependency graph from its configuration and its defaults from the schema, which a project configuration may override.

## Requirements

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

### Requirement: Workstreams run in dependency order

A workstream SHALL start only after every workstream it depends on in the configured topology has finished. Workstreams with no dependency path between them MAY run at the same time.

#### Scenario Outline: `<workstream>` waits for `<dependency>`

- **GIVEN** the default workstreams of the implementer <!-- defaultWorkstreams -->
- **WHEN** the implementer orders them for a change <!-- workstreamsOrdered -->
- **THEN** `<workstream>` starts only after `<dependency>` has finished <!-- startsAfter -->

##### Examples:

  | workstream         | dependency         |
  | ------------------ | ------------------ |
  | clean-architecture | app-domain         |
  | clean-architecture | infrastructure     |
  | clean-architecture | adapters           |
  | integrate          | clean-architecture |

#### Scenario Outline: `<workstream>` and `<other>` may run at the same time

- **GIVEN** the default workstreams of the implementer <!-- defaultWorkstreams -->
- **WHEN** the implementer orders them for a change <!-- workstreamsOrdered -->
- **THEN** `<workstream>` and `<other>` may run at the same time <!-- mayRunTogether -->

##### Examples:

  | workstream         | other          |
  | ------------------ | -------------- |
  | app-domain         | infrastructure |
  | infrastructure     | adapters       |

#### Scenario Outline: a project configuration in sequence makes `<workstream>` wait for `<dependency>`

- **GIVEN** the project configuration chains the workstreams `<sequence>` <!-- projectChainsWorkstreams -->
- **WHEN** the implementer orders them for a change <!-- workstreamsOrdered -->
- **THEN** `<workstream>` starts only after `<dependency>` has finished <!-- startsAfter -->

##### Examples:

  | sequence                                                                                        | workstream     | dependency         |
  | ----------------------------------------------------------------------------------------------- | -------------- | ------------------ |
  | app-domain, infrastructure, adapters, clean-architecture, integrate      | infrastructure | app-domain         |
  | app-domain, infrastructure, adapters, clean-architecture, integrate      | adapters       | infrastructure     |

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

  | layer          | workstream         |
  | -------------- | ------------------ |
  | acceptance     | app-domain         |
  | application    | app-domain         |
  | domain         | app-domain         |
  | infrastructure | infrastructure     |
  | adapters       | adapters           |
  | modules        | clean-architecture |

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

### Requirement: A workstream can be checked alone

`factory check --workstream <workstream> [--module <module>]` SHALL evaluate the rules of the layers that workstream owns, its own whole-product rules and the checks of every workstream it depends on, transitively, and no other rule. When a module is given, it SHALL report only files of that module. When the workstream is unknown, it SHALL exit with status 2 and list the declared workstreams.

#### Scenario Outline: `<workstream>` evaluates `<rule>`

- **GIVEN** the default workstreams of the implementer <!-- defaultWorkstreams -->
- **WHEN** `factory check --workstream <workstream>` runs <!-- workstreamCheckRuns -->
- **THEN** rule `<rule>` is evaluated <!-- ruleEvaluated -->

##### Examples:

  | workstream         | rule                                |
  | ------------------ | ----------------------------------- |
  | app-domain         | entity-validates-with-schema        |
  | infrastructure     | repository-depends-on-acl           |
  | adapters           | adapter-implements-acl              |
  | clean-architecture | modules-are-isolated                |
  | clean-architecture | entity-validates-with-schema        |
  | integrate          | no-unused-files                     |

#### Scenario Outline: `<workstream>` leaves `<rule>` out

- **GIVEN** the default workstreams of the implementer <!-- defaultWorkstreams -->
- **WHEN** `factory check --workstream <workstream>` runs <!-- workstreamCheckRuns -->
- **THEN** rule `<rule>` is not evaluated <!-- ruleNotEvaluated -->

##### Examples:

  | workstream         | rule                            |
  | ------------------ | ------------------------------- |
  | app-domain         | repository-implements-interface |
  | infrastructure     | use-case-is-class-with-execute  |
  | infrastructure     | adapter-implements-acl          |
  | adapters           | repository-depends-on-acl       |

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

  | workstream | status | declared                                                                                      |
  | ---------- | ------ | --------------------------------------------------------------------------------------------- |
  | nothing    | 2      | app-domain, infrastructure, adapters, clean-architecture, integrate    |

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

### Requirement: Acceptance tests are generated from the product specs

For every product spec under the configured product specs root (`productSpecs`, by default `openspec/specs/<module>/<use-case>/spec.md`), `factory generate` SHALL do three things. It SHALL convert the spec to plain Gherkin, run feat2test into the configured acceptance root writing `<module>/<use-case>.feature.test.ts`, and keep `<module>/<use-case>.feature.steps.ts`. `factory generate --check` SHALL fail when a generated acceptance test is older than its spec.

#### Scenario Outline: the product spec `<spec>` generates `<tests>` tests

- **GIVEN** the product specs root `<root>` <!-- productSpecsRoot -->
- **AND** the product spec `<spec>` with `<tests>` Examples rows <!-- productSpecWithRows -->
- **WHEN** `factory generate` runs <!-- generateRuns -->
- **THEN** `<test>` holds `<tests>` tests <!-- generatedTestHolds -->
- **AND** the step adapter `<steps>` exists <!-- stepAdapterExists -->

##### Examples:

  | root                                | spec                                          | tests | test                                          | steps                                          |
  | ----------------------------------- | --------------------------------------------- | ----- | --------------------------------------------- | ---------------------------------------------- |
  | openspec/specs/*/*/spec.md          | openspec/specs/demo/do-thing/spec.md          | 2     | test/acceptance/demo/do-thing.feature.test.ts | test/acceptance/demo/do-thing.feature.steps.ts |
  | openspec/specs/examples/*/*/spec.md | openspec/specs/examples/demo/do-thing/spec.md | 2     | test/acceptance/demo/do-thing.feature.test.ts | test/acceptance/demo/do-thing.feature.steps.ts |

#### Scenario: a product spec changed after generation is stale

- **GIVEN** the product spec `openspec/specs/demo/do-thing/spec.md` was generated <!-- productSpecGenerated -->
- **AND** an Examples row is added to it <!-- examplesRowAdded -->
- **WHEN** `factory generate --check` runs <!-- generateCheckRuns -->
- **THEN** it exits non-zero <!-- exitsNonZero -->

### Requirement: The implementer prepares the configured roots before any workstream

The configuration SHALL name the roots the product lives in (`modules`, `acceptance`, `integration`, `entry`), and `factory prepare` SHALL create every configured root that does not exist. The implementer skill SHALL make prepare its first step, before seams and workstreams.

#### Scenario Outline: the missing root `<root>` is created from `<setting>`

- **GIVEN** the configuration sets `<setting>` to `<value>` <!-- configurationSets -->
- **AND** the directory `<root>` does not exist <!-- directoryMissing -->
- **WHEN** `factory prepare` runs <!-- prepareRuns -->
- **THEN** the directory `<root>` exists <!-- directoryExists -->

##### Examples:

  | setting     | value            | root             |
  | ----------- | ---------------- | ---------------- |
  | modules     | src/*            | src              |
  | modules     | packages/*       | packages         |
  | acceptance  | test/acceptance  | test/acceptance  |
  | integration | test/integration | test/integration |

### Requirement: Prepare lays the agreed base and touches nothing that exists

When it creates the module root, `factory prepare` SHALL lay the base the configuration declares (`base`, directories under the module root) or, without one, a `shared` module with `domain`, `application` and `infrastructure`. It SHALL touch no directory that exists, so running it twice changes nothing.

#### Scenario Outline: the module root `<root>` gets the base `<base>`

- **GIVEN** the configuration sets `modules` to `<value>` and `base` to `<base>` <!-- configurationSetsBase -->
- **AND** the directory `<root>` does not exist <!-- directoryMissing -->
- **WHEN** `factory prepare` runs <!-- prepareRuns -->
- **THEN** the directories `<created>` exist under `<root>` <!-- directoriesExistUnder -->

##### Examples:

  | value      | base                     | root     | created                                             |
  | ---------- | ------------------------ | -------- | --------------------------------------------------- |
  | src/*      | default                  | src      | shared/domain, shared/application, shared/infrastructure |
  | modules/*  | shared/domain, core/lib  | modules  | shared/domain, core/lib                             |

#### Scenario Outline: an existing root `<root>` is left as it is

- **GIVEN** the directory `<root>` exists with the file `<file>` <!-- directoryExistsWith -->
- **WHEN** `factory prepare` runs <!-- prepareRuns -->
- **THEN** `<root>` holds exactly `<file>` <!-- directoryHoldsExactly -->

##### Examples:

  | root | file         |
  | ---- | ------------ |
  | src  | src/main.ts  |

### Requirement: Module rules hold whatever the module root contains

The rules that relate modules to one another (`modules-are-isolated`, `shared-imports-no-module`) SHALL be defined over the configured module root as patterns, not by enumerating the directories present when the implementer loads, so that `factory check` reports the same rule ids with an empty root, with one module and with many.

#### Scenario Outline: the module rules exist with `<modules>` modules

- **GIVEN** the module root holds `<modules>` module directories <!-- moduleRootHolds -->
- **WHEN** the rule ids of the implementer are listed <!-- ruleIdsListed -->
- **THEN** the list includes `modules-are-isolated` and `shared-imports-no-module` <!-- listIncludesModuleRules -->

##### Examples:

  | modules |
  | ------- |
  | 0       |
  | 1       |
  | 3       |

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

### Requirement: Every scaffold renders into a file its layer accepts

A layer's examples MAY hold scaffolds, one per kind, in a section of their own. For every scaffold, this repository's tests SHALL render it with a sample name and module, and SHALL fail naming the scaffold when the rendered file is not at the path its layer's vocabulary gives that kind, or breaks a rule of its layer that reads that file alone.

#### Scenario Outline: the `<kind>` scaffold of `<layer>` renders `<path>`

- **GIVEN** the scaffold of kind `<kind>` in the examples of layer `<layer>` <!-- scaffoldOfKind -->
- **WHEN** it is rendered with name `<name>` in module `<module>` <!-- scaffoldRendered -->
- **THEN** the file `<path>` passes rule `<rule>` <!-- renderedFilePasses -->

##### Examples:

  | kind                 | layer          | name    | module  | path                                                               | rule                         |
  | -------------------- | -------------- | ------- | ------- | ------------------------------------------------------------------ | ---------------------------- |
  | schema               | domain         | Invoice | billing | src/billing/domain/schemas/invoice.schema.ts                       | domain-vocabulary            |
  | entity               | domain         | Invoice | billing | src/billing/domain/entities/invoice.entity.ts                      | entity-validates-with-schema |
  | repository-interface | application    | Invoice | billing | src/billing/application/repository-interfaces/invoice.repository-interface.ts | application-vocabulary |
  | acl                  | infrastructure | Invoice | billing | src/billing/infrastructure/acl/invoice.acl.ts                      | infrastructure-vocabulary    |

#### Scenario Outline: a `<kind>` scaffold that breaks `<rule>` fails the tests

- **GIVEN** the scaffold of kind `<kind>` in the examples of layer `<layer>` renders a file that breaks rule `<rule>` <!-- scaffoldBreaksRule -->
- **WHEN** this repository's tests run <!-- archTestRuns -->
- **THEN** it fails naming the `<kind>` scaffold of `<layer>` <!-- failsNamingScaffold -->

##### Examples:

  | kind   | layer  | rule                         |
  | ------ | ------ | ---------------------------- |
  | entity | domain | entity-validates-with-schema |

### Requirement: A project declares its products by folder

Each entry of `products` in `factory.config.ts` SHALL declare one product with its folder (`root`), its schema and its own settings. A product's configuration SHALL resolve from its schema's defaults, then the project's top level, then its own entry, with its roots relative to its folder. Without `products`, the project SHALL have one product at the repository root.

#### Scenario Outline: the product `<product>` resolves `<setting>` to `<resolved>`

- **GIVEN** the project declares the product `<product>` at `<root>` with the schema `<schema>` <!-- projectDeclaresProduct -->
- **AND** the product `<product>` sets `<setting>` to `<override>` <!-- productSets -->
- **WHEN** the configuration is resolved <!-- configurationResolved -->
- **THEN** `<setting>` of the product `<product>` is `<resolved>` <!-- productSettingResolved -->

##### Examples:

  | product | root        | schema        | setting    | override        | resolved                     |
  | ------- | ----------- | ------------- | ---------- | --------------- | ---------------------------- |
  | api     | apps/api    | clean-backend | modules    | src/*           | apps/api/src/*               |
  | worker  | apps/worker | clean-backend | modules    | lib/*           | apps/worker/lib/*            |
  | api     | apps/api    | clean-backend | acceptance | test/acceptance | apps/api/test/acceptance     |

#### Scenario Outline: without products the project has the one product `<root>`

- **GIVEN** the project configuration declares no products <!-- noProductsDeclared -->
- **WHEN** the configuration is resolved <!-- configurationResolved -->
- **THEN** the project has one product at `<root>` whose `<setting>` is `<resolved>` <!-- singleProductAt -->

##### Examples:

  | root | setting | resolved |
  | ---- | ------- | -------- |
  | .    | modules | src/*    |

### Requirement: Each product's specs and acceptance tests live under that product

In a project with products, the product specs root of a product SHALL default to `openspec/specs/<product>/<module>/<use-case>/spec.md`, and `factory generate` SHALL write the acceptance tests of a product's specs into that product's acceptance root, never into another product's.

#### Scenario Outline: the spec `<spec>` of `<product>` generates `<test>`

- **GIVEN** the project declares the product `<product>` at `<root>` with the schema `<schema>` <!-- projectDeclaresProduct -->
- **AND** the product spec `<spec>` with `<tests>` Examples rows <!-- productSpecWithRows -->
- **WHEN** `factory generate` runs <!-- generateRuns -->
- **THEN** `<test>` holds `<tests>` tests <!-- generatedTestHolds -->

##### Examples:

  | product | root        | schema        | spec                                         | tests | test                                                      |
  | ------- | ----------- | ------------- | -------------------------------------------- | ----- | --------------------------------------------------------- |
  | api     | apps/api    | clean-backend | openspec/specs/api/orders/list/spec.md       | 2     | apps/api/test/acceptance/orders/list.feature.test.ts      |
  | worker  | apps/worker | clean-backend | openspec/specs/worker/billing/charge/spec.md | 1     | apps/worker/test/acceptance/billing/charge.feature.test.ts |

### Requirement: Checks run over each product alone

`factory check` SHALL run each product's rules over that product's folder with that product's schema, and a rule broken in one product SHALL fail only that product.

#### Scenario Outline: a rule broken in `<broken>` fails `<failing>`

- **GIVEN** the project declares the products `<products>` <!-- projectDeclaresProducts -->
- **AND** a file in the product `<broken>` breaks one of its rules <!-- productBreaksRule -->
- **WHEN** `factory check` runs <!-- checkRuns -->
- **THEN** the products that fail are `<failing>` <!-- failingProducts -->

##### Examples:

  | products    | broken | failing |
  | ----------- | ------ | ------- |
  | api, worker | api    | api     |
  | api, worker | worker | worker  |
