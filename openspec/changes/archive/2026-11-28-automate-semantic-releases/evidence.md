---
change: automate-semantic-releases
verdict: verified
digest: 76dee5df14662fc5c7dc26d1028135f5d554a2ce4ba86e6fe0a3873fa3830d39
---

# Evidence of automate-semantic-releases

## Scenarios

| Use case | Requirement | Scenario | Result |
| --- | --- | --- | --- |
| repository/release | A release publishes every package under the ref of its version | releasing version `0.12.0` when `none` is published gives `packages-v0.12.0` holding `backend, frontend, fullstack` | passed |
| repository/release | A release publishes every package under the ref of its version | releasing version `0.12.0` when `packages-v0.11.0` is published gives `packages-v0.12.0` holding `backend, frontend, fullstack` | passed |
| repository/release | A release publishes every package under the ref of its version | releasing version `0.12.0` when `packages-v0.11.0` is published gives `packages-v0.12.0` holding `backend` | passed |
| repository/release | A release publishes every package under the ref of its version | releasing version `0.12.0` when `packages-v0.12.0` is published gives `packages-v0.12.0` holding `as published before` | passed |
| repository/release | A released package names its version | every package released at `0.12.0` names `0.12.0` and carries the command `0.12.0` | passed |
| repository/release | A released package names its version | every package released at `0.12.0` names `0.12.0` and carries the command `0.12.0` #2 | passed |
| repository/release | Main determines the next package release | Merging `fix` after `0.17.0` yields `v0.17.1 and packages-v0.17.1` | passed |
| repository/release | Main determines the next package release | Merging `feature` after `0.17.0` yields `v0.18.0 and packages-v0.18.0` | passed |
| repository/release | Main determines the next package release | Merging `breaking` after `0.17.0` yields `v1.0.0 and packages-v1.0.0` | passed |
| repository/release | Main determines the next package release | Merging `documentation` after `0.17.0` yields `the released version stays at 0.17.0` | passed |

## Checks

Every check passes.

## Review

Run: 0 warning(s).

## Procedures

| Procedure | Environment | Treatment | Outcome |
| --- | --- | --- | --- |
| release | prod | reviewed only |  |
| cambio-secuencial | local | executed | passed |
| cambio-secuencial | prod | reviewed only |  |
