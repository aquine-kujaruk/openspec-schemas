---
change: carry-approved-plans-through-verification
verdict: verified
digest: 92ad2c392ec91a1ef73eced4c9a79cdf6f315098ad51b045023b379a0525b879
---

# Evidence of carry-approved-plans-through-verification

## Scenarios

| Use case | Requirement | Scenario | Result |
| --- | --- | --- | --- |
| factory/production/dispatch-work-order | A ready change is handed to the runner the project configures | handing `add-orders` to the runner `none` gives `build add-orders in this session` | passed |
| factory/production/dispatch-work-order | A ready change is handed to the runner the project configures | handing `add-orders` to the runner `session` gives `build add-orders in this session` | passed |
| factory/production/dispatch-work-order | A ready change is handed to the runner the project configures | handing `add-orders` to the runner `command `remote {change}`` gives `the command received add-orders` | passed |
| factory/production/dispatch-work-order | A ready change is handed to the runner the project configures | handing `add-orders` to the runner `command `remote {change}; exit 3`` gives `the command received add-orders` | passed |
| factory/production/dispatch-work-order | A change that is not ready is not handed off | handing off a change that is `ready` hands off `add-orders` | passed |
| factory/production/dispatch-work-order | A change that is not ready is not handed off | handing off a change that is `not approved` hands off `nothing` | passed |
| factory/production/dispatch-work-order | A change that is not ready is not handed off | handing off a change that is `listing an open question` hands off `nothing` | passed |
| factory/production/dispatch-work-order | A change that is not ready is not handed off | handing off a change that is `not approved` hands off `nothing` #2 | passed |
| factory/production/dispatch-work-order | Implementation starts in the checkout that owns the plan | handing off from `project root` to `project root` gives `continue in this session` | passed |
| factory/production/dispatch-work-order | Implementation starts in the checkout that owns the plan | handing off from `change worktree` to `change worktree` gives `continue in this session` | passed |
| factory/production/dispatch-work-order | Implementation starts in the checkout that owns the plan | handing off from `project root` to `change worktree` gives `bind the implementation to change worktree` | passed |
| factory/production/pull-andon | Feedback updates the change it is about | feedback from `the person` about `add-orders` leaves `1` active change(s) | passed |
| factory/production/pull-andon | Feedback updates the change it is about | feedback from `the completion gate` about `add-orders` leaves `1` active change(s) | passed |
| factory/production/pull-andon | Feedback updates the change it is about | feedback from `the verify phase` about `add-orders` leaves `2` active change(s) | passed |
| factory/production/pull-andon | Feedback updates the change it is about | feedback from `the archive` about `add-orders` leaves `1` active change(s) | passed |
| factory/production/pull-andon | Feedback updates the change it is about | a reviewer finding with `repair in the owned repo` and `one specified outcome` leads to `track and test a separate repair` | passed |
| factory/production/pull-andon | Feedback updates the change it is about | a reviewer finding with `repair in the owned repo` and `two plausible outcomes` leads to `ask which outcome to require` | passed |
| factory/production/pull-andon | Feedback updates the change it is about | a reviewer finding with `no authority` and `one specified outcome` leads to `ask for the repair decision` | passed |
| factory/production/pull-andon | Feedback reopens only what it invalidates | feedback naming phase `2` turns the done phases `1, 2` into `1` | passed |
| factory/production/pull-andon | Feedback reopens only what it invalidates | feedback naming phase `1` turns the done phases `1, 2` into `none` | passed |
| factory/production/pull-andon | Feedback reopens only what it invalidates | feedback naming phase `2` turns the done phases `1` into `1` | passed |
| factory/production/pull-andon | Feedback the agent cannot settle becomes an open question | feedback needing `1` decision(s) from the person leaves the change `not ready` | passed |
| factory/production/pull-andon | Feedback the agent cannot settle becomes an open question | feedback needing `0` decision(s) from the person leaves the change `ready` | passed |
| factory/quality/hold-stage | An agent finishes only when the change's checks pass | finishing with checks that `pass` is `refused` | passed |
| factory/quality/hold-stage | An agent finishes only when the change's checks pass | finishing with checks that `pass` is `refused` #2 | passed |
| factory/quality/hold-stage | An agent finishes only when the change's checks pass | finishing with checks that `pass` is `refused` #3 | passed |
| factory/quality/hold-stage | An agent finishes only when the change's checks pass | finishing with checks that `pass` is `refused` #4 | passed |
| factory/quality/hold-stage | An agent finishes only when the change's checks pass | finishing with checks that `pass` is `allowed` | passed |
| factory/quality/hold-stage | An agent finishes only when the change's checks pass | finishing with checks that `pass` is `allowed` #2 | passed |
| factory/quality/hold-stage | An agent finishes only when the change's checks pass | finishing with checks that `fail` is `refused` | passed |
| factory/quality/hold-stage | An agent finishes only when the change's checks pass | finishing with checks that `fail` is `refused` #2 | passed |
| factory/quality/hold-stage | The third failure in a row hands the change to the person | after `0` failure(s) the change waits for `the agent` | passed |
| factory/quality/hold-stage | The third failure in a row hands the change to the person | after `1` failure(s) the change waits for `the agent` | passed |
| factory/quality/hold-stage | The third failure in a row hands the change to the person | after `2` failure(s) the change waits for `the person` | passed |
| factory/quality/hold-stage | A helper agent is held like the main one | the `helper` agent finishing with checks that `fail` is `refused` | passed |
| factory/quality/hold-stage | A helper agent is held like the main one | the `helper` agent finishing with checks that `pass` is `allowed` | passed |
| factory/quality/hold-stage | An altered harness holds the agent | finishing with `generated tests` altered is `refused` | passed |
| factory/quality/hold-stage | An altered harness holds the agent | finishing with `installed schemas` altered is `refused` | passed |
| factory/quality/hold-stage | An altered harness holds the agent | finishing with `factory configuration` altered is `refused` | passed |
| factory/quality/hold-stage | With no change in implementation the gate holds nobody | finishing with `0` change(s) in implementation is `allowed` | passed |
| factory/quality/hold-stage | With no change in implementation the gate holds nobody | finishing with `0` change(s) in implementation is `allowed` #2 | passed |
| factory/quality/hold-stage | A change is judged by the checks of its own schema | a `clean-backend` change finishing while the product's checks `fail` is `refused` | passed |
| factory/quality/hold-stage | A change is judged by the checks of its own schema | a `spec-plan` change finishing while the product's checks `fail` is `allowed` | passed |
| factory/quality/hold-stage | A change is judged by the checks of its own schema | a `spec-plan` change finishing while the product's checks `pass` is `allowed` | passed |
| factory/quality/hold-stage | A change is judged by its own product alone | a change of `api` finishing while `api` fails is `refused` | passed |
| factory/quality/hold-stage | A change is judged by its own product alone | a change of `api` finishing while `worker` fails is `allowed` | passed |
| flow/planning-probes | Planning exercises the assumptions that can block a phase | planning for `a module check isolates a passing module` records `result with a defect deliberately placed in a second module` | passed |
| flow/planning-probes | Planning exercises the assumptions that can block a phase | planning for `moved specs generate tests where verify looks` records `generation and verification result on one moved spec` | passed |
| flow/planning-probes | Planning exercises the assumptions that can block a phase | planning for `a retirement fails on a spec with example rows` records `observed failure and revised prerequisite or approach` | passed |
| flow/planning-probes | Planning exercises the assumptions that can block a phase | planning for `the required tool is built by a later phase` records `dependency and first phase that can run the probe` | passed |
| flow/planning-probes | Planning exercises the assumptions that can block a phase | planning for `a spec has no generated test in the factory repo` records `planned test coverage and any final personal attestation` | passed |

## Checks

Every check passes.

## Review

Run: 0 warning(s).

## Procedures

None.
