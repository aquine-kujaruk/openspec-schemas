---
name: phases-in-one-run
description: Once the person starts the implementation of a ready change, one run builds every pending phase in order and goes on to verify, stopping only for feedback, a check it cannot fix or something only the person can give
created_at: 2026-11-17
created_by: the person
schema: spec-plan
---

# Every phase in one run

## Goal

A plan's phases are the order of the work in coherent blocks, not points where the agent waits. Once the person starts the implementation of a ready change, the implement phase builds every pending phase in order, each closed by its verification task and the completion gate, starts the next one itself, and goes on to verify once no task is left. It stops early only when feedback is raised, when a check keeps failing and the agent cannot fix it, or when something only the person can give is missing.

## Findings

- "One phase per run" comes from the bootstrap's assumption X3, "`implement` builds the first phase with unchecked tasks and stops, as Codely's `apply` does", listed under Assumed, not Agreed (`openspec/changes/archive/2026-11-14-bootstrap-clean-backend/design.md:65`, seen 2026-11-17).
- The rule stands in `flow/implement` ("One phase is built per run", and the Purpose line), in the implement skill ("One run builds one phase", "The next phase is another run", "its pass ends the run: the next phase starts with step 2 again") and in the README's table of skills ("Starts the next phase of a ready change") (`openspec/specs/flow/implement/spec.md:5,27`, `schemas/shared/phases/implement/SKILL.md:3,8,21,31`, `README.md:92` @82521bc, seen 2026-11-17).
- `factory implement <change>` already starts whichever phase is the first with unchecked tasks and records it in `gate.json`, so calling it again after a phase is done starts the next one; with no task left it prints that verify is next (`toolkit/flow/implement.ts:16-70` @82521bc, seen 2026-11-17).
- The completion gate checks the phase `gate.json` names, falling back to the first phase with unchecked tasks (`toolkit/package/gate.ts:104-135` @82521bc, seen 2026-11-17).
- The feedback skill already hands a ready change back to the implement skill "from the first phase with unchecked tasks" (`schemas/shared/phases/feedback/SKILL.md:23` @82521bc, seen 2026-11-17).
- `flow/implement` has no step adapter: its requirements are proved by the person's word (`README.md`, Work on this repository @82521bc, seen 2026-11-17).

## Decisions

Asked by the person on 2026-11-17: "¿Por qué tienes que depender de mí para eso? [...] las fases sean como el orden en que tienes que hacer las cosas, en bloques congruentes", and "que a partir de ahora todo se haga de un tirón, pero respetando las fases".

- A run builds every pending phase, in order, without asking between phases. Discarded: one phase per run (the bootstrap's assumption, never agreed).
- Phases are still respected: a phase starts only after the previous one's verification task passes, and `factory implement` is run again to start it, so the gate checks the phase being built. Discarded: one flat list of tasks with no verification between blocks.
- The run stops before the end only for feedback, a check the agent cannot make pass, or something only the person can give (a key, approval to read `prod`). Discarded: a pause for the person between phases.

Proposed by the agent and accepted by the person ("Sí, ábrelo"):

- The stop after planning stays: a ready plan waits for the person's go-ahead before implementing, since that is the person's approval of the plan.

Taken from the code and conventions:

- This repository's own change, opened with `spec-plan` (`README.md`, Work on this repository).
- No code changes: `factory implement` already starts the next pending phase each time it is called. Only the specs, the skills and the README say otherwise.
- The requirement is renamed, since its name stated the rule being overturned, and its scenario keeps its title with new rows.
- Version 0.11.0, after `throwaway-spikes` takes 0.10.0: the implement skill the packages carry changes.

Assumptions of mine, not agreed one by one:

- Once no task is left, the same run goes on to verify: verifying judges and raises feedback, it decides nothing. Archive stays a separate run the person starts, since it consolidates the specs and decisions every later change inherits.
- The Purpose line of `flow/implement` ("one phase of a ready change is built per run") is reworded in the same delta, if the archive merges a Purpose; otherwise it is reported as a proposal for the tooling.
- This change is built after `throwaway-spikes`; both touch the implement skill and the README, in different paragraphs.

## Open questions

## Architecture decisions

### Decision: phases-in-one-run · A started implementation builds every pending phase in one run

@adds @area:product @topic:flow @applies:phases @enforced:implement-skill

Once the person starts the implementation of a ready change, the implement phase SHALL build every phase with unchecked tasks in the plan's order, each closed by its verification task and the completion gate, SHALL start the next phase without asking the person, and SHALL go on to verify once no task is left. It SHALL stop early only when feedback is raised, when a check keeps failing and the agent cannot fix it, or when something only the person can give is missing.

**Why** The person approves a plan so as not to be asked again; a pause between phases asked for an approval that adds nothing, since each phase already ends in a verification and the gate. The person: "¿Por qué tienes que depender de mí para eso?".

**Alternatives** One phase per run, as Codely's `apply` does, which the bootstrap assumed and nobody agreed. One run per change with no verification between phases, discarded because the phases are the coherent blocks the person wants respected.

**Consequences** A run is longer and may outlast the context window; the conversation's summaries carry it on. A phase that breaks something a previous phase built is found by the gate only for the phase being built, and by verify for the whole product.

## Procedures

## Screens

## Phases

### Phase 1: the implement skill builds every phase in one run

**Tests**

`flow/implement` is proved by the person's word. The three packages build fresh with the new implement skill.

- [x] Rewrite the implement skill: its description and opening line say a run builds every pending phase in order; step 9 runs the phase's verification task and then `pnpm exec factory implement <change>` again to start the next phase; once it prints that every task is done, follow the `verify` skill; the run stops early only for feedback, a check it cannot make pass, or something only the person can give
- [x] Rewrite the paragraph on the completion gate in the implement skill: its pass closes a phase, not the run
- [x] Reword the README's row for `implement` ("Builds the pending phases of a ready change in order, one workstream at a time, then verifies it") and raise the package and command version to 0.11.0, naming it in the README
- [x] Verify `pnpm run check` passes, the three packages build fresh, and `factory verify phases-in-one-run --proved flow/implement` records the evidence

## Feedback

- Built on 2026-11-17 by the agent, in the same run as `throwaway-spikes`, at the person's request ("Si implementalos").
- Found while building: a delta's Purpose only seeds a spec that does not exist yet (`node_modules/@fission-ai/openspec/dist/core/specs-apply.js:245-257`), so the Purpose line of `flow/implement` still says "one phase of a ready change is built per run". Reported to the person as a proposal for the tooling: let a change reword the Purpose of a spec it modifies.
- Found while building: the completion gate runs only when a turn ends, so between phases inside one run each phase's verification task is what closes it; the skill says so.

## Next step

Archive it, after `throwaway-spikes`.
