## MODIFIED Requirements

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
