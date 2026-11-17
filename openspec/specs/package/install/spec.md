# package/install Specification

## Purpose
Installing a package in a project with one command: the installer checks the machine, installs the package at a released version for the agents asked, pins the command and sets the project up.

## Requirements

### Requirement: One command installs a released package and sets the project up

`@by:person`

Run in a project's root, the installer SHALL install the package it is asked for at the highest released version, or at the version it is asked for, SHALL make the project depend on the command at that version, and SHALL run setup with repair, ending with what setup still reports. When the version asked for was never released, it SHALL install nothing, SHALL exit with status 1 and SHALL name the released versions.

#### Scenario Outline: installing `<package>` asking for `<asked>` when `<released>` are released installs `<installed>`

- **GIVEN** the releases `<released>` are published <!-- releasesPublished -->
- **WHEN** the package `<package>` is installed asking for `<asked>` <!-- installPackageAsking -->
- **THEN** the project holds the package `<package>` at `<installed>` <!-- projectHoldsPackage -->
- **AND** the project depends on the command at `<installed>` <!-- projectDependsOnCommand -->
- **AND** the installer exits with status `<status>` <!-- installerExitStatus -->

##### Examples:

  | package  | asked  | released        | installed | status |
  | -------- | ------ | --------------- | --------- | ------ |
  | backend  | latest | 0.12.0, 0.13.0  | 0.13.0    | 0      |
  | backend  | latest | 0.9.0, 0.12.0   | 0.12.0    | 0      |
  | frontend | 0.12.0 | 0.12.0, 0.13.0  | 0.12.0    | 0      |
  | backend  | 0.10.0 | 0.12.0, 0.13.0  | none      | 1      |

### Requirement: The installer installs for the agents asked

`@by:agent`

The installer SHALL install the package for the agents it is asked for, and for every agent the package names when it is asked for none. It SHALL pin the command whichever of them it installed for. When it is asked for an agent the package does not name, it SHALL install nothing and SHALL exit with status 1, naming the agents the package names.

#### Scenario Outline: installing for `<asked>` installs for `<agents>`

- **GIVEN** the releases `<released>` are published <!-- releasesPublished -->
- **WHEN** the package `<package>` is installed for the agents `<asked>` <!-- installPackageForAgents -->
- **THEN** the package is installed for the agents `<agents>` <!-- packageInstalledForAgents -->
- **AND** the project depends on the command at `<installed>` <!-- projectDependsOnCommand -->
- **AND** the installer exits with status `<status>` <!-- installerExitStatus -->

##### Examples:

  | released | package | asked         | agents        | installed | status |
  | -------- | ------- | ------------- | ------------- | --------- | ------ |
  | 0.12.0   | backend | none          | claude, codex | 0.12.0  | 0      |
  | 0.12.0   | backend | claude        | claude        | 0.12.0  | 0      |
  | 0.12.0   | backend | codex         | codex         | 0.12.0  | 0      |
  | 0.12.0   | backend | claude, codex | claude, codex | 0.12.0  | 0      |
  | 0.12.0   | backend | cursor        | none          | none    | 1      |

### Requirement: The installer names what the machine lacks and installs only the package manager

`@by:agent`

Before it installs anything, the installer SHALL check the machine. When the agent package manager is missing, it SHALL install it at the version the package names and go on. When Node, at the version the package needs or later, pnpm or git is missing, it SHALL install nothing, SHALL exit with status 1 and SHALL name what is missing and the version it needs.

#### Scenario Outline: a machine lacking `<lacking>` leaves the package manager `<packageManager>` and exits `<status>`

- **GIVEN** the releases `<released>` are published <!-- releasesPublished -->
- **AND** the machine lacks `<lacking>` <!-- machineLacks -->
- **WHEN** the package `<package>` is installed asking for `<asked>` <!-- installPackageAsking -->
- **THEN** the installer names `<named>` as missing <!-- installerNamesMissing -->
- **AND** the agent package manager is `<packageManager>` <!-- packageManagerIs -->
- **AND** the installer exits with status `<status>` <!-- installerExitStatus -->

##### Examples:

  | released | package | asked  | lacking                   | named      | packageManager      | status |
  | -------- | ------- | ------ | ------------------------- | ---------- | ------------------- | ------ |
  | 0.12.0   | backend | latest | nothing                   | nothing    | as it was           | 0      |
  | 0.12.0   | backend | latest | the agent package manager | nothing    | installed at 0.35.1 | 0      |
  | 0.12.0   | backend | latest | Node 22.18                | Node 22.18 | as it was           | 1      |
  | 0.12.0   | backend | latest | pnpm                      | pnpm       | as it was           | 1      |
  | 0.12.0   | backend | latest | git                       | git        | as it was           | 1      |
