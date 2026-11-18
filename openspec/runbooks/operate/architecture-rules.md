# architecture-rules

### Procedure: maintain-architecture-rules · Read, change and verify a Clean Core rule

@origin:2026-11-18-independizar-aceptacion-del-modelo @env:local @by:agent

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
