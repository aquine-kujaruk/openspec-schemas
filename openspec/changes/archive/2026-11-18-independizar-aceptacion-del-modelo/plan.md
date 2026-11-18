---
name: independizar-aceptacion-del-modelo
description: Keep semantic acceptance cases independent of the decision model that evaluates them.
created_at: 2026-11-18
created_by: Edgar
approved_at: 2026-11-18
schema: spec-plan
---

# Keep semantic acceptance independent of the evaluator

## Goal

Semantic acceptance cases declare inputs and expected answers. The configured evaluator can change without edits to the cases or regeneration of their tests. Evidence records which evaluator answered and supports offline replay when the configured evaluator and inputs match.

## Findings

- On 2026-11-18, the seven layers' example files contained 46 accepted judgement blocks with the concrete model name, raw score and fingerprint. S17/wrapper-id in `domain.examples.md` is one of them.
- On 2026-11-18, a local read of the 46 blocks and their adjacent `*.scores.json` files matched all 46 by model, score and the SHA-256 digest of the recorded identity. No model calls are needed to migrate the current fixtures.
- On 2026-11-18, `factory/quality.ts` already set the decision model from `review.model` and generated provider-neutral Vitest titles. It inferred the expected answer from the case name. The semantic recorder wrote the model metadata back into the fixture.
- On 2026-11-18, `factory verify` already matched checked-in linting tests against delta scenarios by name. The preceding certificate recorded 21 passing linting scenarios. This change can use the same evidence route.

## Decisions

- The acceptance contract declares its expected answer and leaves model names and observations in configuration and evidence. @by:person
- Use a one-word `expect` block for each semantic case, read it as the source of truth and keep the existing score histories. Prefer a migration of the current format to a second file for expected answers or inference from case names. @by:agent
- Replace the existing history lookup with the latest matching record for the configured evaluator and input fingerprints. Preserve earlier observations, including from other evaluators. Reject missing evidence when offline and offer the refresh command. Do not substitute an earlier successful verdict for a later failure of the same version. @by:agent
- Exercise evaluator replacement with two local test doubles behind the existing decision-client interface. Keep this change independent of production credentials and avoid adding a provider integration without a concrete provider requirement. @by:agent

## Open questions

## Architecture decisions

### Decision: semantic-acceptance-independent-of-evaluator · Acceptance declares the expected verdict

@adds @area:product @topic:tests @applies:acceptance,toolkit @enforced:architecture/linting @by:person

Semantic acceptance cases SHALL declare the expected answer independently of any evaluator. The selected evaluator SHALL come from configuration. Model identity, raw probabilities and fingerprints SHALL belong to execution evidence.

**Why** The expected verdict describes the rule. A change in evaluator calls for new measurements of the same cases.

**Alternatives** Naming the current model in the example file couples a rule's meaning to a particular evaluation run.

**Consequences** The acceptance fixture is stable across evaluator changes. Evidence is keyed to its evaluator and inputs and is refreshed independently.

## Procedures

### Procedure: maintain-architecture-rules · Read, change and verify a Clean Core rule

@modifies:maintain-architecture-rules @base:2026-11-18-reparar-revision-semantica @purpose:operate @topic:architecture-rules @env:local @by:agent

**When** A maintainer investigates a diagnostic or adds, tightens, relaxes or retires an architectural rule.

**Requires** This repository with its dependencies. Deterministic and semantic cases run with Vitest. Live evidence uses the configured evaluator and its credentials. Follow the decision model access procedure when you need live access.

**Steps**

1. Locate the layer and its requirement under `openspec/specs/architecture/<layer>/spec.md`, or the rubric row under the core's or schema's `review/RUBRIC.md`. Search the slug or row id under `schemas/shared/cores/clean-core/workstreams/` or in the framework workstream of its owning schema. Read the requirement, the rule in `<layer>.rules.ts` or the row's question, its cases and their `expect` blocks in `<layer>.examples.md`, and the valid reference in the same file. For example, `acl-adapter-paired` has an `acl-without-adapter` case: ArchUnit identifies `src/module/infrastructure/acl/invoice.acl.ts`.
2. Follow the sequential change runbook. In the delta, give the rule a stable slug. Show the smallest case that breaks it and the closest valid case. Include the imported files for checks that resolve imports. For a relaxed rule, exercise the newly accepted example and a nearby violation that should still fail. For a retired rule, remove its requirement, registration, cases and outcome together, and verify neighbouring rules.
3. Choose a reproducible check where the facts permit it. Fallow can examine references across resolved files, Oxlint can inspect syntax, imports and globals, and ArchUnit can check conventions and relationships specific to the architecture. Keep a rubric row for what only interpretation decides. Reproduce the missed violation before changing the check, and keep a legitimate near miss in the reference.
4. For a deterministic rule, add the check in the owning layer and run `pnpm exec factory generate` and `pnpm exec factory expect <layer>`. Inspect the recorded diff: the new example must identify the intended file and tool.
5. For a rubric row, write its binary question and, under `## <row> · <slug>` in the layer's `examples.md`, a counterexample and a closely matched valid case with every file the judgement needs, such as two independent cycle detections against one detection and a caller that delegates to it. Declare `yes` or `no` in each case’s `expect` block. Configure the evaluator separately. Run `pnpm exec factory expect <layer> --case <row>/<case> --changed` to refresh the matching evidence in `<layer>.scores.json`. Read confidence in the expected answer (p for yes, 1−p for no). At 95% or above the case passes. From 90% inclusive to below 95% it passes with a warning. Below 90%, inspect the mismatch before changing the example or question.
6. Run the generated Vitest suite for the layer, the slug/case consistency tests and `pnpm exec factory check` on Factory, then `pnpm exec factory review` with the key set when the change requires a live product audit. Read the judgement report: compare each raw score with the mean of all its earlier observations. A shift of at least 20 points raises a warning even when confidence passes. Inspect the named model, question or file changes and retain all observations. A review that reports itself incomplete is rerun once the cause is fixed. Follow the configuration through the consuming schema and the built package; Clean Core is shared by clean-backend and clean-react.
7. Resolve findings within the existing workflow: the person decides at planning or reviews and gives feedback at verification. Record a correction or an evidenced justification for every review warning before closing.

**Verification** A maintainer can find the slug or row, reproduce the diagnostic or judgement and verify the reference. A semantic refresh only changes execution evidence. The layer replays offline when the matching evidence exists. For a live product audit, the evidence records its completion and the disposition of every warning.

## Screens

## Phases

### Phase 1: Acceptance and evaluator evidence have separate sources

**Seams**

- A rubric case carries its declared answer as `yes` or `no`.
- Evidence lookup matches evaluator identity, question and all files. The existing evidence history stays authoritative.

**Tests**

- `test/schemas/architecture/linting.test.ts` names each modified requirement and scenario. Its fixture evaluator exercises both verdicts, thresholds, invalid declarations, failed results and history.
- Use two evaluator identities on the same source and assert that the case and generated test are byte-identical. Switching back reuses that evaluator's latest matching observation. A failed matching observation stays a failure.
- All 46 migrated cases replay with offline evidence. Prove each changed scenario with an executed assertion. Model calibration and live product calls are outside the verification for this change.

- [x] Parse the explicit expected answer and make the CLI and generated checks consume it.
- [x] Migrate the 46 rubric declarations and retain all score histories. Move semantic recording entirely to the evidence path. Keep deterministic recording intact.
- [x] Match recorded evidence by evaluator and inputs, including when switching back to a previously evaluated model.
- [x] Document the authoring and refresh workflow. Regenerate only where needed.
- [x] Verify with type checking, generator freshness, the complete offline Vitest suite, Factory checks and named scenario evidence.

## Feedback

- The implement gate detected that replacing existing scenario titles would prevent OpenSpec from merging the delta. The delta preserves those titles and their example rows while changing how the expected answer and its evidence are declared.

- The whole suite detected that the deterministic recorder test stripped all expect blocks when preparing inputs. Its fixture helper now strips only deterministic findings, and compares rubric declarations as part of the preserved text.

- Type checking, Factory architecture checks, test generation and local backend and frontend builds passed. The full offline suite passed 906 tests and replayed all 46 cases. The S17 refresh reused existing evidence with the key set to an empty string, leaving the example and history unchanged.

## Next step

Run named scenario verification and archive the change.
