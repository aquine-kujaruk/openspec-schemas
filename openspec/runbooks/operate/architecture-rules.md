# architecture-rules

### Procedure: maintain-architecture-rules · Read, change and verify a Clean Core rule

@origin:2026-11-18-reparar-revision-semantica @env:local @by:person

**When** A maintainer investigates a diagnostic or adds, tightens, relaxes or retires an architectural rule.

**Requires** This repository with its dependencies. Deterministic and semantic cases run with Vitest. Recording a semantic case, or rerunning one whose fingerprint changed, uses the model and key variable configured for the project; the current default reads `OPENAI_API_KEY` from `.env` and uses `gpt-6-luna`.

**Steps**

1. Locate the layer and its requirement under `openspec/specs/architecture/<layer>/spec.md`, or the rubric row under the core's or schema's `review/RUBRIC.md`. Search the slug or row id under `schemas/shared/cores/clean-core/workstreams/` or in the framework workstream of its owning schema. Read the requirement, the rule in `<layer>.rules.ts` or the row's question, its cases and their recorded `expect` blocks in `<layer>.examples.md`, and the valid reference in the same file. For example, `acl-adapter-paired` has an `acl-without-adapter` case: ArchUnit identifies `src/module/infrastructure/acl/invoice.acl.ts`.
2. Follow the sequential change runbook. In the delta, give the rule a stable slug. Show the smallest case that breaks it and the closest valid case. Include the imported files for checks that resolve imports. For a relaxed rule, exercise the newly accepted example and a nearby violation that should still fail. For a retired rule, remove its requirement, registration, cases and outcome together, and verify neighbouring rules.
3. Choose a reproducible check where the facts permit it. Fallow can examine references across resolved files, Oxlint can inspect syntax, imports and globals, and ArchUnit can check conventions and relationships specific to the architecture. Keep a rubric row for what only interpretation decides. Reproduce the missed violation before changing the check, and keep a legitimate near miss in the reference.
4. For a deterministic rule, add the check in the owning layer and run `pnpm exec factory generate` and `pnpm exec factory expect <layer>`. Inspect the recorded diff: the new example must identify the intended file and tool.
5. For a rubric row, write its binary question and, under `## <row> · <slug>` in the layer's `examples.md`, a counterexample and a closely matched valid case with every file the judgement needs, such as two independent cycle detections against one detection and a caller that delegates to it. Run `pnpm exec factory expect <layer>`: it judges each case with the model and records verdict, score and fingerprint. Read confidence in the expected answer (p for yes, 1−p for no). Record at 95% or above, or with a warning from 90% inclusive to 95% exclusive. Below 90%, inspect the mismatch before changing the example or question. Use `--changed` to reuse a measurement of the same version.
6. Run the generated Vitest suite for the layer, the slug/case consistency tests and `pnpm exec factory check` on Factory, then `pnpm exec factory review` with the key set. Read the judgement report: compare each raw score with the mean of all its earlier observations. A shift of at least 20 points raises a warning even when confidence passes. Inspect the named model, question or file changes and retain all observations. A review that reports itself incomplete is rerun once the cause is fixed. Follow the configuration through the consuming schema and the built package; Clean Core is shared by clean-backend and clean-react.
7. Resolve findings within the existing workflow: the person decides at planning or reviews and gives feedback at verification. Record a correction or an evidenced justification for every review warning before closing.

**Verification** A second maintainer can find the slug or row, reproduce the recorded diagnostic or judgement and verify the valid reference. `pnpm test` passes with the key unset while no case changed. The evidence names the review as complete and lists the disposition of every warning.
