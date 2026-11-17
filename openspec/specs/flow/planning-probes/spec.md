# flow/planning-probes Specification

## Purpose
Make the evidence and prerequisites of a plan visible before approval.

## Requirements

### Requirement: Planning exercises the assumptions that can block a phase

`@by:agent`

Before approval, the plan SHALL record a representative probe for each unproven tool assumption that could block a phase or its verification. If a probe fails, the plan SHALL address the failure. If it must wait, the plan SHALL identify the reason and earliest check. For each affected spec, the plan SHALL name the evidence and any personal attestation still required after execution.

#### Scenario Outline: planning for `<assumption>` records `<finding>`

- **GIVEN** a proposed phase depends on `<assumption>` <!-- phaseDependsOn -->
- **WHEN** the planner prepares the proposal for approval <!-- prepareForApproval -->
- **THEN** the plan records `<finding>` <!-- proposalRecords -->

##### Examples:

  | assumption                                      | finding                                                     |
  | ----------------------------------------------- | ----------------------------------------------------------- |
  | a module check isolates a passing module        | result with a defect deliberately placed in a second module |
  | moved specs generate tests where verify looks   | generation and verification result on one moved spec        |
  | a retirement fails on a spec with example rows  | observed failure and revised prerequisite or approach       |
  | the required tool is built by a later phase     | dependency and first phase that can run the probe           |
  | a spec has no generated test in the factory repo | planned test coverage and any final personal attestation   |
