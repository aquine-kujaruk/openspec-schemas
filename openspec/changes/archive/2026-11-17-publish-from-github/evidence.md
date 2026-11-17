---
change: publish-from-github
verdict: verified
digest: 094b1e913f94d6b62dffed719f8e07c045c0a0e45f6c8734751207f718645f82
---

# Evidence of publish-from-github

## Scenarios

| Use case | Requirement | Scenario | Result |
| --- | --- | --- | --- |
| package/install | One command installs a released package and sets the project up | installing `backend` asking for `latest` when `0.12.0, 0.13.0` are released installs `0.13.0` | passed |
| package/install | One command installs a released package and sets the project up | installing `backend` asking for `latest` when `0.9.0, 0.12.0` are released installs `0.12.0` | passed |
| package/install | One command installs a released package and sets the project up | installing `frontend` asking for `0.12.0` when `0.12.0, 0.13.0` are released installs `0.12.0` | passed |
| package/install | One command installs a released package and sets the project up | installing `backend` asking for `0.10.0` when `0.12.0, 0.13.0` are released installs `none` | passed |
| package/install | The installer installs for the agents asked | installing for `none` installs for `claude, codex` | passed |
| package/install | The installer installs for the agents asked | installing for `claude` installs for `claude` | passed |
| package/install | The installer installs for the agents asked | installing for `codex` installs for `codex` | passed |
| package/install | The installer installs for the agents asked | installing for `claude, codex` installs for `claude, codex` | passed |
| package/install | The installer installs for the agents asked | installing for `cursor` installs for `none` | passed |
| package/install | The installer names what the machine lacks and installs only the package manager | a machine lacking `nothing` leaves the package manager `as it was` and exits `0` | passed |
| package/install | The installer names what the machine lacks and installs only the package manager | a machine lacking `the agent package manager` leaves the package manager `installed at 0.35.1` and exits `0` | passed |
| package/install | The installer names what the machine lacks and installs only the package manager | a machine lacking `Node 22.18` leaves the package manager `as it was` and exits `1` | passed |
| package/install | The installer names what the machine lacks and installs only the package manager | a machine lacking `pnpm` leaves the package manager `as it was` and exits `1` | passed |
| package/install | The installer names what the machine lacks and installs only the package manager | a machine lacking `git` leaves the package manager `as it was` and exits `1` | passed |
| repository/release | A release publishes every package under the ref of its version | releasing version `0.12.0` when `none` is published gives `packages-v0.12.0` holding `backend, frontend, fullstack` | passed |
| repository/release | A release publishes every package under the ref of its version | releasing version `0.12.0` when `packages-v0.11.0` is published gives `packages-v0.12.0` holding `backend, frontend, fullstack` | passed |
| repository/release | A release publishes every package under the ref of its version | releasing version `0.12.0` when `packages-v0.11.0` is published gives `packages-v0.12.0` holding `backend` | passed |
| repository/release | A release publishes every package under the ref of its version | releasing version `0.12.0` when `packages-v0.12.0` is published gives `packages-v0.12.0` holding `as published before` | passed |
| repository/release | A released package names its version | every package released at `0.12.0` names `0.12.0` and carries the command `0.12.0` | passed |
| repository/release | A released package names its version | every package released at `0.12.0` names `0.12.0` and carries the command `0.12.0` #2 | passed |

## Checks

Every check passes.

## Review

Run: 0 warning(s).

## Procedures

| Procedure | Environment | Treatment | Outcome |
| --- | --- | --- | --- |
| github-personal | local | executed | passed |
| release | prod | reviewed only |  |
