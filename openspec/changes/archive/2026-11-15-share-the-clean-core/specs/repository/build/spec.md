## MODIFIED Requirements

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

## ADDED Requirements

### Requirement: A schema builds through the workstreams of its core and its own

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
  | backend  | clean-backend | clean-core | app-domain, infrastructure, adapters, modules, integrate | none                  | app-domain, infrastructure, adapters, modules, integrate                        |
  | frontend | clean-react   | clean-core | app-domain, infrastructure, adapters, modules, integrate | react-ui, react-hooks | app-domain, infrastructure, adapters, modules, integrate, react-ui, react-hooks |

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
  | backend | clean-backend | clean-core | app-domain, infrastructure, adapters, modules, integrate | modules | modules | 0             |
