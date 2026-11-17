---
name: carry-approved-plans-through-verification
description: Keep approved work in the right checkout through verification and resolve predictable blockers before implementation.
created_at: 2026-11-17
created_by: the person
approved_at: 2026-11-17
schema: spec-plan
---

# Carry approved plans through verification

## Goal

An implementation session opens in the checkout containing its approved plan. The main agent closes each phase in order and verifies the change before finishing. The planner tests assumptions that could block that sequence and identifies any evidence that will still need the person.

## Findings

- On 2026-11-17 the implementation reported phase one verified with four phases left. It resumed on a further user message. The T3 thread had no bound worktree. The missing binding is observable; the exact reason the agent stopped is unknown.
- The same change found that retiring specs with example tables failed, generated test paths disagreed with verification, and a module check reported another module’s faults. The chosen module check closed every phase. Source on 2026-11-17: the Decisions and Feedback of the factory-as-clean-backend plan in its worktree.
- At main 0e27df9, the completion gate removes the started record on a main-agent pass. A helper pass retains it. The acceptance adapter receives the agent kind but omits it when invoking the gate. The handoff already starts shell runners in the project root it resolved. Source on 2026-11-17: factory/package/application/gate.ts, factory/package/completion-gate.feature.steps.ts and factory/flow/application/handoff.ts.
- On 2026-11-17 the two existing gate and handoff feature suites passed all 27 tests. They exercise temporary projects, including the old verdict permitting a stop. Run: pnpm exec vitest run factory/package/completion-gate.feature.test.ts factory/flow/handoff.feature.test.ts.
- The archive already checks evidence against the current plan, specs and product digest. Verification requires the person’s word for a repository spec without a generated test. Source on 2026-11-17: factory/flow/application/archive.ts and openspec/specs/flow/verify/spec.md.

## Decisions

- Base the proposal on main. Before implementation, reconcile with the ongoing factory-as-clean-backend migration if it has landed. Reuse the renamed capabilities and step adapters; duplicating the pre-migration specs would split their history. @by:agent
- Use the existing project runner and checkout identity. Teach launchers to bind the receiving session in their native way and document T3 as an example. A new T3 integration would exclude other runners. @by:agent
- Reuse the archive’s evidence freshness check and the existing feedback and failure states. Maintaining a second completion record would allow conflicting verdicts. @by:agent
- Offer a separately planned, linked reviewer repair when a probe identifies a prerequisite. The person may approve both plans together. A previously approved repair plan can cover a discovered instance only within its stated reviewer, rule and repair boundary. A bare parent approval supplies no approval date for another plan. @by:agent
- Keep project-wide behaviour in the packaged flow and its tests. A personal Codex instruction would leave other installations dependent on their operator. @by:agent

## Open questions

## Architecture decisions

### Decision: phases-in-one-run · A started implementation builds every pending phase in one run

@modifies:phases-in-one-run @base:2026-11-17-phases-in-one-run @area:product @topic:flow @applies:phases @enforced:implement-skill,completion-gate @by:agent

The main agent SHALL start in the checkout of the approved plan, build its pending phases in order, close each with its verification task and continue through verification. On an attempted stop, a passing phase with pending work SHALL return the next action. Feedback, a check that repeatedly fails and input only the person can give remain valid stops.

**Why** The person already approved the ordered work. The recorded incident required a further prompt after a passing phase.

**Alternatives** Relying on the skill alone permitted the observed stop.

**Consequences** A helper can finish its assigned work. The main agent retains ownership until verification or a recorded reason to yield.

## Procedures

## Screens

## Phases

### Phase 1: Hand off into the approved checkout

**Tests**

Exercise the default session and a local command runner using a disposable repository and a linked worktree. Include the same branch-relative change path in both checkouts to catch path-only comparisons.

- [ ] Identify the resolved checkout in the handoff result. Update the packaged flow and runner instructions to compare it with the actual receiving session root before edits. On mismatch, bind the launcher to the intended checkout and resume there. A shell cd in a different host session is insufficient.
- [ ] Add the handoff scenarios, including matching roots, a mismatched session and the existing runner exit-status contract. For installed consumers verify their expected project instructions and hooks. For the factory source repository use its documented source workflow.
- [ ] Verify the handoff suite and run a local runner that reports its actual working directory. Record how to check T3’s session binding independently of the shell.

### Phase 2: Retain the main agent through verification

**Tests**

Exercise the main and helper stop entry points against a real two-phase plan. Cover checks passing with work left, a completed final phase with absent or stale evidence, success, pending feedback, a missing input, and the third failing check.

- [ ] Update gate acceptance adapters to pass the actual helper flag. Build fixtures with started phases, checked tasks and current or stale evidence. Support existing started records without a phase title.
- [ ] Keep the main agent’s started record while tasks or current verification remain outstanding. Return the next action without counting continuation as a failed check. Handle repeated stop calls and ensure a helper exit cannot clear the main run.
- [ ] Preserve the altered-harness checks, product and schema scope, failure handoff and feedback resume path. Keep the write guard’s protection after tasks finish while verification is pending.
- [ ] Verify via a two-phase CLI replay. Attempt to stop after phase one, continue phase two, attempt to stop before verify, verify, then stop successfully. Repeat the intermediate stop three times and confirm it never becomes a failure handoff.

### Phase 3: Find blockers before approval and route reviewer defects

**Tests**

Replay a migration probe on a disposable fixture and present its Findings. Exercise both branches of the reviewer rule with an approved, bounded repair and with a rule whose meaning is open.

- [ ] Update plan instructions to exercise only unproven tool behaviour needed to start, close or verify a phase. Reuse representative evidence. Record the command, relevant input and observed result, or the earliest feasible check and reason for deferral.
- [ ] Include how each affected spec will be proved. Choose generated acceptance coverage when feasible; if the repository still requires personal attestation, flag it before approval and request it against actual results at verification.
- [ ] Align implement, feedback and the question policy. Record the owning spec, reproducer, repair approval and negative control. Retest with the rebuilt reviewer before resuming. Preserve the installed checker's integrity and ask when the rule, ownership or authorization is open.
- [ ] Verify the feedback suite and a sample plan against the new planning scenarios. Run pnpm run check, build all three packages and check their packaged skills and hooks. Include the repository’s required version increment for the packaged changes.


## Feedback

- The person approved the pending plans. The factory migration has landed. The three affected deltas now target its dispatch, stage hold and andon specs.

## Next step

Implement all phases in order. Prove the planning instruction with a fixture test that exercises its probe and evidence criteria.
