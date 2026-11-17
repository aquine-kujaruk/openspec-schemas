## Purpose

Handing an approved change to its implementation: the project says where a change is built, in the same session or through a command it names, and the handoff takes it there.

## ADDED Requirements

### Requirement: A ready change is handed to the runner the project configures

`@by:person`

The handoff SHALL hand a change that validation reports ready to the runner the project configures. With no runner configured, or with the runner `session`, it SHALL say that the change is built in the same session with the implement phase. With a command as runner, it SHALL run that command with the change's name in place of `{change}`, and SHALL exit with the command's status.

#### Scenario Outline: handing `<change>` to the runner `<runner>` gives `<outcome>`

- **GIVEN** a project whose runner is `<runner>` <!-- projectRunner -->
- **AND** a change `<change>` that validation reports ready <!-- readyChange -->
- **WHEN** the change `<change>` is handed off <!-- handOff -->
- **THEN** the handoff gives `<outcome>` <!-- handoffGives -->
- **AND** it exits with status `<status>` <!-- handoffExitStatus -->

##### Examples:

  | runner                          | change     | outcome                                   | status |
  | ------------------------------- | ---------- | ----------------------------------------- | ------ |
  | none                            | add-orders | build add-orders in this session          | 0      |
  | session                         | add-orders | build add-orders in this session          | 0      |
  | command `remote {change}`       | add-orders | the command received add-orders           | 0      |
  | command `remote {change}; exit 3` | add-orders | the command received add-orders         | 3      |

### Requirement: A change that is not ready is not handed off

`@by:agent`

The handoff SHALL hand off nothing, SHALL exit with status 1 and SHALL name what keeps the change from being ready, when validation does not report it ready.

#### Scenario Outline: handing off a change that is `<state>` hands off `<handed>`

- **GIVEN** a project whose runner is `<runner>` <!-- projectRunner -->
- **AND** a change `<change>` that is `<state>` <!-- changeInState -->
- **WHEN** the change `<change>` is handed off <!-- handOff -->
- **THEN** the runner received `<handed>` <!-- runnerReceived -->
- **AND** it exits with status `<status>` <!-- handoffExitStatus -->

##### Examples:

  | runner                    | state                          | handed     | status | change     |
  | ------------------------- | ------------------------------ | ---------- | ------ | ---------- |
  | command `remote {change}` | ready                          | add-orders | 0      | add-orders |
  | command `remote {change}` | not approved                   | nothing    | 1      | add-orders |
  | command `remote {change}` | listing an open question       | nothing    | 1      | add-orders |
  | session                   | not approved                   | nothing    | 1      | add-orders |
