---
name: probe-resources-while-planning
description: The plan phase probes every access the implementation will need, records what it saw and how to get there, lets the person decline an access without blocking, and doctor notes a key a runbook needs that the environment lacks
created_at: 2026-11-16
created_by: the person
schema: spec-plan
---

# Probe resources while planning

## Goal

Once the person approves a plan, the implementation needs nothing more from them. The plan phase smoke-tests every access the change will use (an API behind an adapter, the git repository, what is deployed, the logs) with a minimal authenticated read, under the agent's real permissions, and writes how to get there as an access procedure that archiving turns into a runbook. What is missing (a key, an authentication scheme, a permission) is asked once, as an open question; when the person does not want to configure it, the procedure is written all the same, marked declined, and the change goes ready: the implementation will fail on that access, and if it is still not configured at the end, that part is not done. What the probes observed is handed to the implementation in a new `## Findings` section, and `factory doctor` notes, at the start of every phase, a key a runbook needs that the environment lacks.

## Findings

- Today the plan phase only reads `openspec/runbooks`; nothing calls a resource before a change is ready (`schemas/shared/phases/plan/SKILL.md:17` @ddb9aa1).
- Validation has no rule about probing: its rules are open questions, operation tags, decision and procedure tags, credentials in procedures, tasks and delta specs (`schemas/spec-plan/validators/standard/validator.ts:190` @ddb9aa1).
- `access` is already one of the four purposes of a procedure (`validator.ts:9` @ddb9aa1), and procedures consolidate by purpose and topic into `openspec/runbooks/<purpose>/<topic>.md` (`openspec/specs/flow/archive/spec.md:141` @ddb9aa1).
- Verify executes procedures only in `local` and `sandbox` and never in `prod` (`toolkit/flow/verify.ts:14`, `openspec/specs/flow/verify/spec.md:93` @ddb9aa1), and a procedure in `local` or `sandbox` with no outcome makes the change not verified (`toolkit/flow/verify.ts:192` @ddb9aa1).
- An agent never writes `.claude/settings.json`, `.claude/settings.local.json` or `.codex` (`toolkit/package/guard.ts:66` @ddb9aa1): a permission the agent lacks can only be added by the person.
- Tags are read as `@name:value` (`toolkit/flow/plan.ts:25` @ddb9aa1); `.env` is merged under the process environment by `loadEnv` (`toolkit/architecture/review/env.ts:5` @ddb9aa1).
- The plan template and the plan instruction live in `spec-plan` and are reused by `clean-backend` and `clean-react` (`schemas/clean-backend/schema.ts:2`, `schemas/clean-react/schema.ts:3` @ddb9aa1), so one edit reaches every schema.

## Decisions

Agreed with the person in the Easel session of 2026-11-16:

- What enforces the probe is a rule of `factory validate`: every access procedure the change adds, modifies, replaces or renames carries `@probed` (a date, or `declined`), or the change is not ready. Discarded: an instruction in the plan skill alone (nothing would notice a skipped probe), and a `factory probe` command that runs each procedure (its steps are prose today; a much larger change).
- A resource counts as probed when its key is present and one authenticated read call answers. Discarded: the key's presence alone (a wrong key or authentication scheme would surface in implement), and also calling every operation the anti-corruption layer will use to capture the response's shape (it brings forward the contract tests the adapters skill postponed, and stores samples).
- The probe calls `local` and `sandbox` freely. In `prod` it makes one read call only after the person approves it as an open question of the plan. The person added that this is also how the plan sees the state of production. Discarded: never calling `prod` (the authentication of a production-only resource would surface in implement), and reading `prod` without asking (it breaks verify's line that `prod` is never executed).
- Scope: every access the implementation will need, in any schema, not only adapters: an API, the git repository, what is deployed, the logs. The person: "no es solo adapters, también puedes ver qué es lo que hay en Git, qué es lo que hay desplegado. Puedes ver logs […] la utilización de herramientas para recopilar datos para la implementación no se puede dejar a la implementación. Al menos debería ser un smoke test si se tiene accesos".
- A missing key or a failed authentication becomes an open question that names the variable and where to obtain it. The person may answer that they do not configure it now: the procedure is written all the same with `@probed:declined`, a line under Decisions says so, and the change goes ready. The implementation then fails on that access, and if it is still not configured at the end, that part is not done. The person, in feedback on 2026-11-16: "no vamos a ser tan estrictos […] se le deja pasar y que falle la implementación […] si no quiere ponerlo al final, ya no se hace […] déjalo fluir". The same holds for a refused permission and for a call in `prod` the person does not approve. Discarded: holding the change not ready until every access is configured (the first version of this decision), and stopping to ask in chat at once (it breaks writing the whole first proposal before asking).
- The probe runs under the agent's real permissions; a refused command becomes an open question naming the exact permission the person adds. It probes the minimum that shows the implementation will work. When the plan runs in auto or bypass permission mode, permissions are not checked unless the person asks for it. Discarded: not looking at permissions.
- What the probes observed goes to a new section `## Findings` of the plan template, each fact with its source and its date. Discarded: inside Decisions (a fact that justifies no decision is lost), and inside the procedure's Verification (archiving would copy a stale fact into the runbook).
- `factory doctor` reports as a `note` each key that a consolidated access procedure names and that neither the environment nor `.env` holds: the agent relays it and goes on. The person first chose `missing`; the feedback of 2026-11-16 ("no vamos a ser tan estrictos") turned it into a note, since a key the person declined would otherwise stop every phase for good. Discarded: `missing`, and leaving doctor out of this change.

Taken from the code and conventions, and shown to the person in the approved synthesis:

- This repository's own change, opened with `spec-plan` (`openspec/config.yaml`, `README.md:146`).
- It changes the shared plan phase, its instruction and its template, so it holds for every schema (`openspec/changes/archive/2026-11-15-clean-react/plan.md:134`).
- What a probe learns about reaching a resource is written as a procedure of purpose `access`, topic the resource, with its environments; no new artifact. Archiving consolidates it into `openspec/runbooks/access/<topic>.md`.
- A standing access procedure is reused: the plan repeats its Verification step and writes `@modifies:<slug>` with `@base` only when something changed.
- The probe reads the secret from the environment or the store the procedure names and never prints or writes its value; the procedure names the variable and where it is kept (`no-credential-in-procedure`).
- A resource that a linked change (`x-linked`) builds does not exist yet: the plan notes it and does not probe it.
- The record of a probe is the tag `@probed:<YYYY-MM-DD>` on the procedure; the keys doctor reads are the tag `@keys:<VAR>[,<VAR>]`. Tags are this repository's channel for what a machine reads.
- Specs in English; `flow/plan` has no step adapter and is proved by the person's word, `flow/plan-validation` and `package/setup` by their generated tests.

Assumptions of mine, not agreed one by one:

- Verify records a procedure tagged `@probed:declined` that it was given no outcome for as `declined` and does not count it against the verdict; given an outcome, it treats it as any other. Without it, a declined access would keep its change from being verified and archived.
- `@probed` is required only of procedures of purpose `access`; `setup`, `diagnose` and `operate` procedures may change things and are not smoke-tested while planning. A `@removes` block needs none.
- `@keys` is optional: an access that needs no environment variable (git over an SSH agent) carries none. A secret read from a store, not from a variable, is not listed in `@keys`.
- `factory doctor` reads `@keys` only from consolidated procedures (`openspec/runbooks`), not from those of an open change.
- The note names the runbook and the variable; the setup skill needs no change, since a `note` is already relayed once and the phase goes on (`schemas/shared/phases/plan/SKILL.md:10`).
- `## Findings` facts are not consolidated by the archive: they stay in the archived change. The section sits right after Goal.
- Version 0.6.0 for the package and the command: the plan phase, validation, verify and doctor change behaviour.

## Open questions

## Architecture decisions

### Decision: probe-while-planning · Every access a change needs is probed before it is ready

@adds @area:product @topic:flow @applies:phases,schemas,toolkit @enforced:procedure-probed,doctor

The plan phase SHALL smoke-test, with a minimal authenticated read under the agent's real permissions, every access the change will use, and SHALL write each as a procedure of purpose `access` carrying `@probed`. What a probe lacks (a key, an authentication scheme, a permission, approval to read `prod`) SHALL be an open question, which the person MAY answer by declining it: the procedure is then written with `@probed:declined` and the change MAY be ready. A change SHALL NOT be ready while an access procedure it adds or changes carries no `@probed`. Verify SHALL NOT fail a change on a declined access it was given no outcome for. `factory doctor` SHALL note a key a consolidated access procedure names in `@keys` and the environment lacks.

**Why** The person approves a plan to stop being interrupted; what most often interrupts the implementation is a missing key, an unclear authentication or a refused command. Finding them while planning, and writing the runbook, means the next change does not ask again.

**Alternatives** An instruction in the plan skill with no check, discarded because a skipped probe goes unnoticed until implement. A command that executes procedures, discarded because procedures are prose. Leaving probes to the implementation, discarded by the person. Holding a change until every access is configured, discarded by the person: a declined access lets it flow.

**Consequences** Planning a change that reaches a resource now needs access to it, or the person's answer. A declined access is built against its anti-corruption layer but fails when called for real, and the evidence shows it as declined. Permissions are proved for the planning session only; an implementation run in another mode may differ.

## Procedures

## Phases

### Phase 1: validation holds an unprobed access procedure, and verify lets a declined one through

**Tests**

The generated tests of the requirement added to `flow/plan-validation`: an access procedure with `@probed` set to a date or to `declined` is ready, without it or with any other value it is not, and a procedure of another purpose needs none. The generated tests of the requirement modified in `flow/verify`: a declined procedure with no outcome is recorded `declined` and leaves the change verified.

- [x] Add the rule `procedure-probed` to the standard validator: an access procedure that adds, modifies, replaces or renames carries `@probed` with a `YYYY-MM-DD` date or `declined`, and the finding names `@probed`
- [x] Add the step adapter method `procedureBlockOfPurposeProbed` to `plan-validation.feature.steps.ts` and generate the tests
- [x] Make `toolkit/flow/verify.ts` record a procedure tagged `@probed:declined` with no outcome as `declined`, outside the procedures that fail the verdict, and print it
- [x] Add the step adapter method `planProcedureProbedAs` and `procedureOutcomeIs` to the verify step adapters and generate the tests
- [x] Verify `pnpm run check` passes

### Phase 2: the plan phase probes, asks and hands over what it saw

**Tests**

`flow/plan` has no step adapter: its added requirements are proved by the person's word. `pnpm run check` keeps the schemas under `openspec/schemas` fresh after the template and the instruction change.

- [x] Add a step to `schemas/shared/phases/plan/SKILL.md`, after reading what stands: list every access the change will use; for each, reuse a standing access procedure or write one, run a minimal authenticated read under the agent's real permissions (skipping the permission check in auto or bypass mode unless the person asks), never print a secret, tag it `@probed`, and turn what is missing into an open question the person may decline, which writes the procedure with `@probed:declined`; ask before any call in `prod`; skip what a linked change builds
- [x] Extend `planInstruction` in `schemas/spec-plan/schema.ts`: access procedures carry `@probed` and, when they read environment variables, `@keys`; facts observed go to `## Findings` with their source and date
- [x] Add `## Findings` after `## Goal` in `schemas/spec-plan/templates/plan.md`, and `@probed` and `@keys` to the procedure block's comment
- [x] Run `pnpm exec factory generate` and verify `pnpm run check` passes

### Phase 3: doctor notes a key a runbook needs

**Tests**

The generated tests of the requirement added to `package/setup`: a key named in a consolidated procedure's `@keys` and absent from the environment and `.env` is reported as a note and leaves the status at 0, with or without repair; present in either, it is not reported.

- [x] Make `toolkit/package/doctor.ts` read `@keys` of the consolidated procedures and add a note for each absent key, naming the runbook and the variable, never repairing it
- [x] Add the step adapter methods `runbookNeedsKey` and `keyPresence` to `setup.feature.steps.ts` and generate the tests
- [x] Verify `pnpm run check` passes

### Phase 4: the package carries it

**Tests**

`factory build backend --check`, `factory build frontend --check` and `factory build fullstack --check` are fresh after a build.

- [x] Update the README: the plan phase probes accesses, a declined access, `## Findings`, `@probed` and `@keys`, and doctor noting a missing key
- [x] Raise the package and command version to 0.6.0
- [x] Verify `pnpm run check` passes, the three packages build fresh, and `factory verify probe-resources-while-planning --proved flow/plan` records the evidence

## Feedback

- Easel session on 2026-11-16 with the person: the eight decisions listed as agreed came from there, with the person's notes quoted; the person approved a synthesis that listed the rest as taken from the code. The assumptions above were not part of it.
- **the person**: Less strict: when the person states they do not want to configure an access from the start (a key, an authentication, a permission, a call in prod), the plan writes the same access procedure and lets the change through as ready; the implementation will fail on that access, and if the person still does not configure it at the end, that part is simply not done. Let it flow. Changes: a declined access is tagged @probed:declined (agreed now, no longer an assumption); verify records a declined procedure it was not told about as declined and does not fail on it; doctor reports a missing runbook key as a note, not as missing.
- Built on 2026-11-16 by the agent, all four phases in one run, at the person's request ("Implementalo").
- Found while building (phase 3): archiving kept only `@env` on a consolidated procedure, so doctor would never have seen `@keys`. Archive now keeps `@probed` and `@keys` too (`toolkit/flow/archive.ts`), proved by `toolkit/flow/archive.test.ts`; `readConsolidated` reads `@keys`.
- Found while building (phase 3): `doctor` takes the environment as an option (the process environment by default), so its tests can set a key without touching the process.
- Found while building (phase 2): the setup skill needed no change; a `note` is already relayed once and the phase goes on.

## Next step

Build it through the implement phase, phase by phase, then verify and archive it. The two changes after it, in the order the person gave: end-to-end tests of the React layer with `github.com/e2e-inc/e2e`, and a reference module that also writes.
