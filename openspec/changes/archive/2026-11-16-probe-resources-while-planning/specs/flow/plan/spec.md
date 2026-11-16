## ADDED Requirements

### Requirement: Every access the change will need is probed while planning

Before the plan is ready, the plan phase SHALL probe each access the change will use with a minimal authenticated read and SHALL write it as an access procedure, reusing a standing one when the runbooks hold it. What the probe lacks SHALL be listed as an open question: a missing key, a refused authentication, a command the agent's permissions refuse, or a call in production the person has not approved. When the person declines to configure it, the plan phase SHALL keep the access procedure, mark it declined and remove the question, so the change can be ready. An access that a linked change builds SHALL NOT be probed.

#### Scenario Outline: probing `<resource>`, which `<outcome>`, leaves its procedure `<procedure>` and `<open>` open question(s)

- **GIVEN** an intention whose change will reach `<resource>` <!-- intentionReaching -->
- **AND** probing it `<outcome>` <!-- probeOutcome -->
- **WHEN** the plan phase writes the first proposal <!-- writeFirstProposal -->
- **THEN** the plan holds the access procedure for `<resource>` as `<procedure>` <!-- planHoldsAccessProcedure -->
- **AND** the plan lists `<open>` open question(s) <!-- planListsOpenQuestions -->

##### Examples:

  | resource                         | outcome                                | procedure        | open |
  | -------------------------------- | -------------------------------------- | ---------------- | ---- |
  | the invoices API in sandbox      | answers                                | probed           | 0    |
  | the invoices API in sandbox      | finds no key in the environment        | unprobed         | 1    |
  | the invoices API in sandbox      | is refused by the agent's permissions  | unprobed         | 1    |
  | the production logs              | needs a call in production             | unprobed         | 1    |
  | an API a linked change builds    | is skipped                             | absent           | 0    |
  | an API a standing runbook covers | answers                                | kept as it stood | 0    |
  | the invoices API in sandbox      | lacks a key the person declines to set | declined         | 0    |
  | the production logs              | needs a call the person declines       | declined         | 0    |

### Requirement: The agent's permissions are probed unless it plans unrestricted

The plan phase SHALL run its probes under the agent's real permissions. When the agent plans in an auto or bypass permission mode, the plan phase SHALL NOT check permissions, unless the person asks it to.

#### Scenario Outline: planning in `<mode>` mode with the person asking `<asked>` checks permissions `<checked>`

- **GIVEN** an agent planning in the permission mode `<mode>` <!-- agentPermissionMode -->
- **AND** the person asked for a permission check `<asked>` <!-- personAskedPermissionCheck -->
- **WHEN** the plan phase writes the first proposal <!-- writeFirstProposal -->
- **THEN** the agent's permissions are checked `<checked>` <!-- permissionsChecked -->

##### Examples:

  | mode    | asked | checked |
  | ------- | ----- | ------- |
  | default | no    | yes     |
  | auto    | no    | no      |
  | bypass  | no    | no      |
  | bypass  | yes   | yes     |

### Requirement: What the probes observed is handed to the implementation

The plan phase SHALL write each fact its probes observed under the plan's Findings, with the source it came from and the date it was seen.

#### Scenario Outline: `<facts>` observed fact(s) leave `<facts>` finding(s) with source and date

- **GIVEN** probes that observed `<facts>` fact(s) <!-- probesObservedFacts -->
- **WHEN** the plan phase writes the first proposal <!-- writeFirstProposal -->
- **THEN** the plan's Findings list `<facts>` fact(s), each with its source and date <!-- findingsListFacts -->

##### Examples:

  | facts |
  | ----- |
  | 2     |
  | 0     |
