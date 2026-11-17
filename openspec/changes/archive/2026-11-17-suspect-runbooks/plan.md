---
name: suspect-runbooks
description: Setup flags a consolidated runbook that runs a script, a binary or a file the project no longer has, and the plan phase investigates it and updates it, removes it or tells the person
created_at: 2026-11-17
created_by: the person
schema: spec-plan
---

# Suspect runbooks

## Goal

A runbook that names a command the project no longer has stops going unnoticed: `factory doctor` flags it as `suspect`, naming the procedure, its file and what is missing. The plan phase investigates every suspect and either folds its update into the change it plans, opens a change of its own that modifies or removes it, or tells the person why it left it standing. A migration such as moving a React app from one dev server to Vite leaves no `local-run` pointing at the old one.

## Findings

- `factory doctor` already reads the consolidated procedures, but only their `@keys`, and turns each missing key into a `note` that does not change the exit status (`toolkit/package/doctor.ts:330-342` @695e2b7, seen 2026-11-17).
- `readConsolidated` keeps a block's file, `@origin` and `@keys`, not its body (`toolkit/flow/consolidated.ts:8-34` @695e2b7, seen 2026-11-17).
- Every phase skill starts with `pnpm exec factory doctor`, follows `setup` on `missing` or `drift`, and relays a `note` once and goes on (`schemas/shared/phases/*/SKILL.md`, step 1, @695e2b7, seen 2026-11-17).
- The write guard keeps `openspec/runbooks` out of an agent's reach: "write a procedure in a plan; archiving consolidates it" (`toolkit/package/guard.ts:50-53` @695e2b7, seen 2026-11-17). A runbook is changed or removed only through a change.
- Validation already accepts a change of `spec-plan` that holds only a procedure tagged `@modifies`, `@replaces` or `@removes`, with `skip_specs: true` and no phase; verify executes a `local` or `sandbox` procedure the change carries, and archive applies the tag (`schemas/spec-plan/schema.ts:10,39`, `openspec/specs/flow/verify/spec.md:95`, `toolkit/flow/archive.ts:150-153` @695e2b7, seen 2026-11-17).
- The completion gate holds a turn while a started change fails `factory check` (`README.md`, "The flow" @695e2b7, seen 2026-11-17).
- The package and the command are at 0.8.0, raised by `the-reference-writes`, still active (`package.json` @695e2b7 plus the working tree, seen 2026-11-17).

## Decisions

Asked by the person: "que el factory doctor/check marque como sospechoso un runbook que nombra comandos que ya no se utilizan. Y si el agente detecta eso, que el agente vaya y lo investigue, y si de verdad cree que hay que eliminarlo, lo elimina o le avisa al usuario."

- `factory doctor` flags it, not `factory check`: check judges product code and the completion gate holds a turn on it, so a stale runbook would block a change in implementation that has nothing to do with it. Doctor runs at the start of every phase.
- A new report kind, `suspect`, printed as `suspect: <detail>`, does not change the exit status, and setup never repairs it. Discarded: a `note`, which phases relay to the person without looking; and `missing`, which sends every phase to setup and fails `doctor`.
- What doctor judges is only what the repository can tell, read from the procedure's inline code and fenced code blocks:
  - a package script run as `pnpm run <s>`, `pnpm <s>` (when `<s>` is not a pnpm command), `npm run <s>` or `yarn <s>`, looked up in the `scripts` of the root `package.json` and of every product's root;
  - a binary run as `pnpm exec <b>` or `npx <b>`, looked up in `node_modules/.bin` of the root and of every product's root; `npx <package>@<version>` is fetched, not judged;
  - a file run by relative path (`./<path>`) or given to `node`, `tsx`, `bash` or `sh`, looked up from the repository root.
  Discarded: judging any other tool (`kubectl`, `docker`, `curl`, `pnpm dlx`), which the repository cannot tell is gone; and every path a runbook mentions, which names files that exist only in another environment.
- Every procedure is judged whatever its `@env`: a script or a file is gone from the repository in every environment.
- The detail names the procedure, its file, the command and what is missing: `the procedure local-run (openspec/runbooks/setup/local-run.md) runs pnpm run start and no package.json has the script start`.
- The plan phase investigates every suspect, right after reading what stands (step 5), and writes what it found under Findings: when and in which commit what the runbook names left (`git log -S`), and what replaced it, if anything. Then:
  - the intention being planned is what left it stale, or touches its topic: the plan tags the procedure `@modifies` or `@replaces` with what replaced it, or `@removes` when what it served is gone;
  - unrelated to the intention, and the investigation is conclusive: a change of its own, of `spec-plan`, holding only that procedure tagged the same way, with `skip_specs: true` and no phase; the agent validates it ready and tells the person it is there to verify and archive;
  - the investigation is not conclusive, or what doctor flagged exists where doctor does not look: no change touches it, and the person is told what was found. A false flag is also reported as a proposal for the schema's repository.
  Discarded: deleting the runbook directly, which the write guard forbids and which would skip verify, where a modified `local` procedure is executed.
- The other phases (implement, verify, archive, feedback) relay each `suspect` once and go on, and so does `setup`: investigating there would pull the phase away from its change. Discarded: investigating in every phase, which repeats the same work four times per change.
- No tag silences a suspect: a runbook flagged wrongly is a defect of the detector, fixed in this repository. Discarded: an `@unchecked` tag, which would let a stale runbook hide for good.
- Version 0.9.0: the command, the setup skill and the phase skills the packages carry change.

## Open questions

## Architecture decisions

## Procedures

## Screens

## Phases

### Phase 1: doctor flags a suspect runbook

**Tests**

The generated tests of the requirement added to `package/setup`, through new step adapter methods `runbookRuns` and `projectHolds` in `toolkit/package/setup.feature.steps.ts`, the rest reused. `toolkit/package/suspects.test.ts` covers the reading of commands: inline code and fenced blocks, `pnpm <s>` against pnpm's own commands, a file after `node`, `tsx`, `bash`, `sh` or `./`, a package fetched at a version, and a shell comment inside a fenced block, which ends no block.

- [x] Make `readConsolidated` keep each block's body in `toolkit/flow/consolidated.ts`
- [x] Write `toolkit/package/suspects.ts`: the commands a procedure runs, read from its inline and fenced code, and the detail of each one whose script, binary or file the project lacks, looking in the root and every product's root
- [x] Add `suspects` to doctor's `Report`, print each as `suspect: <detail>` in `factory doctor`, and keep it out of the exit status and of the repairs
- [x] Add the step adapter methods and run `pnpm exec factory generate`
- [x] Verify `pnpm run check` passes

### Phase 2: the agent investigates what doctor flags

**Tests**

The generated tests of the requirement added to `flow/plan` (no step adapter: proved by the person's word). `factory build backend --check`, `factory build frontend --check` and `factory build fullstack --check` are fresh after a build.

- [x] Tell the plan skill: step 1 relays nothing about a `suspect`; a new step after reading what stands investigates each one and acts as the Decisions above say, writing what it found under Findings
- [x] Tell the implement, verify, archive and feedback skills, and the setup skill, to relay each `suspect` once and go on
- [x] Say in the README, under the paragraph on probes or setup, what a `suspect` is and what the plan phase does with it
- [x] Raise the package and command version to 0.9.0 and name it in the README
- [x] Verify `pnpm run check` passes, the three packages build fresh, and `factory verify suspect-runbooks --proved flow/plan` records the evidence

## Feedback

- Built on 2026-11-17 by the agent, both phases in one run, at the person's request ("Sip").
- Found while building (phase 1): a project always has `node_modules`, since the command doctor runs from lives there, so skipping binaries without it guarded nothing. The row became a package fetched at a version (`npx create-vite@5.5.0 web`), which is not judged.
- Found while building (phase 1): `readConsolidated` ended a block at any line starting with `#`, a shell comment inside a fenced block among them; it now tracks fences, and a block keeps its body.
- Found while building (phase 2): the archive tests fail between 00:00 and 01:00 CET, before and after this change: `today()` in `toolkit/flow/archive.ts` takes the UTC date and the specification tool names the archived folder with the local one. The checks were run with `TZ=UTC`; the defect is left for a change of its own.

## Next step

`implement` builds phase 1. `the-reference-writes` raises the version to 0.8.0 first; this change takes 0.9.0 on top of it.
