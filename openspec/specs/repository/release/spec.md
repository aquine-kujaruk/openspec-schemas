# repository/release Specification

## Purpose
Releasing the packages: every package the repository builds is published together at the repository's version, under one ref a project installs from.

## Requirements

### Requirement: A release publishes every package under the ref of its version

`@by:agent`

A release SHALL build every package the repository has a manifest for and SHALL publish them together under the ref `packages-v<version>`, `<version>` being the repository's version, each package in a folder named after it that holds the package as a build gives it. A release SHALL leave every ref published before it as it was. When the ref of its version is already published, the release SHALL publish nothing and SHALL exit with status 1, naming the ref.

#### Scenario Outline: releasing version `<version>` when `<published>` is published gives `<ref>` holding `<packages>`

- **GIVEN** a repository at version `<version>` with the package manifests `<manifests>` <!-- repositoryAtVersion -->
- **AND** the releases `<published>` are already published <!-- releasesPublished -->
- **WHEN** the packages are released <!-- releasePackages -->
- **THEN** the ref `<ref>` holds the packages `<packages>` <!-- refHoldsPackages -->
- **AND** the releases `<published>` are as they were <!-- releasesUnchanged -->
- **AND** the release exits with status `<status>` <!-- releaseExitStatus -->

##### Examples:

  | version | manifests                    | published        | ref              | packages                     | status |
  | ------- | ---------------------------- | ---------------- | ---------------- | ---------------------------- | ------ |
  | 0.12.0  | backend, frontend, fullstack | none             | packages-v0.12.0 | backend, frontend, fullstack | 0      |
  | 0.12.0  | backend, frontend, fullstack | packages-v0.11.0 | packages-v0.12.0 | backend, frontend, fullstack | 0      |
  | 0.12.0  | backend                      | packages-v0.11.0 | packages-v0.12.0 | backend                      | 0      |
  | 0.12.0  | backend, frontend, fullstack | packages-v0.12.0 | packages-v0.12.0 | as published before          | 1      |

### Requirement: A released package names its version

`@by:agent`

Each package a release publishes SHALL name the version of its release in its manifest and SHALL carry the command at that same version.

#### Scenario Outline: every package released at `<version>` names `<named>` and carries the command `<command>`

- **GIVEN** a repository at version `<version>` with the package manifests `<manifests>` <!-- repositoryAtVersion -->
- **AND** the releases `<published>` are already published <!-- releasesPublished -->
- **WHEN** the packages are released <!-- releasePackages -->
- **THEN** every released package names the version `<named>` <!-- releasedPackagesNameVersion -->
- **AND** every released package carries the command at `<command>` <!-- releasedPackagesCommand -->

##### Examples:

  | version | manifests         | published | named  | command |
  | ------- | ----------------- | --------- | ------ | ------- |
  | 0.12.0  | backend           | none      | 0.12.0 | 0.12.0  |
  | 0.12.0  | backend, frontend | none      | 0.12.0 | 0.12.0  |
