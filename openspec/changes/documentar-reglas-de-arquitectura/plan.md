---
name: documentar-reglas-de-arquitectura
description: Give maintainers a repeatable way to read, change and verify a Clean Core architecture rule.
created_at: 2026-11-18
created_by: the person
approved_at: 2026-11-18
schema: spec-plan
---

# Maintaining a Clean Core architecture rule

## Goal

A maintainer can trace a diagnostic to the requirement, reproduce it on a small example, and prove how it behaves on Factory and in the package that delivers it. When a rule needs judgement, the procedure identifies the evidence the model received and how the author resolved its finding.

## Findings

- On 2026-11-18 the original procedure in the adjacent checkout, `arch-linter-poc/.claude/skills/architecture-rule/SKILL.md`, linked four things by slug: requirement, cases, implementation and recorded result. This repository maintains their equivalents in `openspec/specs/architecture/`, the owning workstream of `schemas/shared/cores/clean-core/`, and `tools/expect.ts`.
- On 2026-11-18 the actual rubric loader and file selector found zero Factory files with the configured audit pattern `src/*`, and 234 distinct files with `factory/*`. S05 and S17 were excluded by the vocabulary filter because their English questions contain `return` or `returns`. The local selector probe made no model request. The current audit leaves cross-file rows to a human.
- On 2026-11-18 the person authorized one production decision request with two synthetic pairs. The unmodified Factory decision client received HTTP 200 from OpenAI Decisions using `gpt-6-luna`. Both methods in pair A filtered required dependencies independently (probability of duplication 1). In pair B the second method delegated to the first (probability 0). A separate fixture returned its programmed 0.99 and 0.01. This proves the client can send and classify these two snippets together. Automatic file selection, cache invalidation and evidence for cross-file findings still need implementation and verification.
- On 2026-11-18, `pnpm exec vitest run --project clean-core schemas/shared/cores/clean-core/workstreams/adapters/adapters.feature.test.ts` passed all 15 tests. The file exercises an ACL missing its adapter and the valid reference implementation.
- On 2026-11-18 the clean-core rule ID and case ID suites passed all 18 tests, and `pnpm exec factory generate --check` exited successfully.
- On 2026-11-18, `pnpm exec factory schemas` listed the three schemas. `factory doctor` looked for a package installed in a consuming project and returned status 2 in the source checkout. The contributing guide supplies the repository commands. The previous change was merged and tagged at `e5fa876`; no other change was active.
- On 2026-11-18 the domain contained 34 aggregate, entity and value-object classes without role suffixes, although the scaffolds name those roles. The core check disabled unused value and type exports. The published package exposes both its main entry and `factory/sdk`.
- On 2026-11-18 `PrepareLineUseCase` handled a missing line itself. `PlantRepositoryImplementation` constructed `Plant` and its lines. `WorkCenter` held direct dependencies, while `Process` and `WorkCenterTopologyService` each traversed the graph. `ReleasedWorkOrderAdapter.readStarted()` forwarded directly to an injected function.

## Decisions

- Start with the repository's rule-authoring runbook. After it closes, deliver one family at a time. Each family includes its new standard, examples and the Factory migration in the same PR. @by:person
- Use one local, positive/negative deterministic case and one multi-file semantic case to verify that the procedure is usable. Record separately the parts that can run on today's tools and the downstream work that will automate the agreements. @by:agent
- Send a bounded set of related files to the configured decision model when ownership spans files. Record the resolution of each warning before closing, either a correction or an evidenced explanation of why the implementation meets the rule. @by:person
- If the model becomes unavailable, restore it and rerun the judgement. The person decides during planning or reviews and gives feedback during verification. Use the existing stages for these interactions. @by:person

## Open questions


## Architecture decisions

## Procedures

### Procedure: maintain-architecture-rules · Read, change and verify a Clean Core rule

@adds @purpose:operate @topic:architecture-rules @env:local @by:person

**When** A maintainer investigates a diagnostic or adds, tightens, relaxes or retires an architectural rule.

**Requires** This repository with its dependencies. The local deterministic examples run with Vitest. A live semantic audit uses the model and key variable configured for the project. The current default reads `OPENAI_API_KEY` and uses `gpt-6-luna`.

**Steps**

1. Locate the layer and its requirement under `openspec/specs/architecture/<layer>/spec.md`. Search the requirement slug under `schemas/shared/cores/clean-core/workstreams/` or in the framework workstream of its owning schema. Read the requirement, the rule in `<layer>.rules.ts`, the case and its recorded `expect` in `<layer>.examples.md`, and the valid reference in the same file. For example, `acl-adapter-paired` has an `acl-without-adapter` case: ArchUnit identifies `src/module/infrastructure/acl/invoice.acl.ts`. The reference pairs that interface with an adapter.
2. Follow the sequential change runbook. In the delta, give the rule a stable slug. Show the smallest case that breaks it and the closest valid case. Include the imported files for checks that resolve imports. For a relaxed rule, exercise the newly accepted example and a nearby violation that should still fail. For a retired rule, remove its requirement, registration, cases and outcome together, and verify neighbouring rules.
3. Choose a reproducible check where the facts permit it. Fallow can examine references across resolved files, Oxlint can inspect syntax, imports and globals, and ArchUnit can check conventions and relationships specific to the architecture. Reproduce the missed violation before changing the check. Keep a legitimate near miss in the reference. A public SDK export is a near miss for an unused internal export; an in-memory resource implementation is a near miss for an adapter that only forwards an internal callback.
4. Add the check in the owning layer and run `pnpm exec factory generate` and `pnpm exec factory expect <layer>`. Inspect the recorded diff: the new example must identify the intended file and tool. Run the generated Vitest suite for the layer, the slug/case consistency tests, and `pnpm exec factory check` on Factory. Follow the configuration through the consuming schema and the built package. Clean Core is shared by clean-backend and clean-react.
5. For a judgement, write a binary rubric question, a violation and a closely matched valid case. Verify that the loader accepts the row and that the selector reaches the intended files. Compare, for example, two independent implementations of cycle detection with one implementation and a caller that delegates to it. Supply the model with both methods and the relevant domain owner. Record the row, model, threshold, files, reported ranges and answer for each case. Where narrowing or caching is enabled, check that the related methods are still present and a change to either input triggers a fresh judgement. An accepted row with an empty unexpected selection counts as an incomplete run. An unchanged, previously judged set can legitimately require zero new judgements. To test access independently of file selection, use the decision-model access procedure.
6. While the shipped auditor skips cross-file rows, report that limitation and identify the downstream change that supplies and tests the full context. Distinguish observed model output, a fixture-driven exercise, an omitted row, and a model call that failed. If the model is down, restore it and retry. Resolve findings within the existing workflow: the person decides at planning or reviews and gives feedback at verification. Record a correction or an evidenced justification for every warning before closing.

**Verification** For the deterministic example, a second maintainer can find the slug, reproduce the expected diagnostic and verify the valid reference. For the semantic example, the evidence names the input files, the contrasting examples, their actual evaluation status and the disposition of any warning. Record any pending live judgement explicitly.

### Procedure: probe-decision-model · Check access to the configured decision model

@adds @purpose:access @topic:decision-model @env:prod @probed:2026-11-18 @keys:OPENAI_API_KEY @by:agent

**When** A change to architecture auditing needs to establish whether the configured client and model return predicate probabilities.

**Requires** The project key in the configured environment or local `.env`. For Factory the default variable is `OPENAI_API_KEY`. Follow the project's planning procedure for approval of the production read.

**Steps**

1. Use `openAiClient` from `factory/quality/infrastructure/adapters/audit-decision.adapter.ts` with the project's model and key. Load the key without printing it.
2. Give the client one state containing four synthetic snippets: in pair A, both methods return `xs.filter(x => x.required)`; in pair B, the first filters and the other returns `this.c.deps(xs)`. Send one predicate per pair in the same request: do both files independently implement the filtering rule?
3. Record the model, request outcome and both named probabilities. Record an unavailable service as an incomplete probe. Restore availability and retry before relying on the result.

**Verification** The configured client receives a valid response with a probability for each pair. Classifier performance on actual rules is verified with that rule's own cases.

## Screens

## Phases

## Feedback

The following decisions guide the subsequent changes. Their implementation begins in the family that owns them, after this procedure has been archived.

| Topic | Decision and acceptance case | Source |
| --- | --- | --- |
| CLI composition | The convention applies to Factory. Its module controller composes the use case. A thin outer entry wires department dependencies and preserves the public SDK and CLI commands. A future API and the CLI can submit the same request to the core. Revise the layout ADR in that change. | Easel, Factory-only option. Original note: “Si, es el composition root”. @by:person |
| Hydration | Keep S05 and S19. The repository returns validated data. The use case calls a domain factory once to obtain the complete plant. The domain owns the error for a required line; preserve the optional lookup for callers that can accept absence. | Easel, application option. @by:person |
| Runtime contracts | A domain contract named as a schema has executable validation and an inferred type. Reuse the definition at the boundary when the shapes match. An order with a string in its boolean builds field must be rejected. | Easel, executable-schema option. @by:person |
| Application branches | Judge the responsibility of a branch. Move the unknown-line policy into the domain. Keep a branch in application when it coordinates whether to perform I/O. For a path already resolved by the write policy, the work-order repository is never called. | Easel, branch-responsibility option. @by:person |
| Topology | A work center describes direct dependencies. The Process aggregate owns ordering and cycles across centers. Both the runtime loader and the domain use that calculation. For A → B → A, one implementation detects the cycle. | Easel, Process aggregate option. @by:person |
| Internal ports | The composition root connects the change-control port to the production operation. It adapts the result to the validated consumer contract and preserves error semantics. The rule that pairs resource ACLs with adapters must distinguish internal ports; check the valid HTTP, disk and in-memory cases as well. | Easel, direct composition option. @by:person |

The recording is session `20261118-103440`. Each row below connects a requested change with a concrete acceptance case for its owning family.

| Capture position and local time | Requested change | Acceptance case |
| --- | --- | --- |
| 01:01 · 10:35:42 and 23:58 · 10:58:39 | Put CLI glue and composition in the framework. | A controller translates arguments, hook payload, standard input, output and exit status. Calling the same core operation from another transport preserves its decision. |
| 02:20 · 10:37:01 and 12:21 · 10:47:02 | Keep the use case readable and give the domain its decisions. | A missing required line produces the same error. Authorizing a path already resolved by the policy never loads the work orders. |
| 04:00 · 10:38:41 and 13:39 · 10:48:20 | Validate contracts at runtime and make each class name reveal its role. | A TypeScript-only alias in a schema file cannot be mistaken for executable validation. The checker recognizes the aggregate suffix in the exported class as well as the file name. |
| 08:36 · 10:43:17 and 09:57 · 10:44:38 | Document how to author and read rules, including semantic judgements. | A rule author can distinguish a missed violation, an excluded row, an empty selection and an observed pass. |
| 12:49 · 10:47:30 and 13:05 · 10:47:45 | Justify aggregates and fold scalar wrappers into the owning schema. | Fold WorkCenterId and StandardId into their owner's validated fields. Preserve the valid empty name of the implicit line. Judge collection objects by their meaning and behaviour. |
| 15:26 · 10:50:07 and 25:30 · 11:00:11 | Delegate to the closest semantic owner. Use a domain service when the rule genuinely spans owners and is reused. | Distinguish a direct dependency of one center from a cycle in the process. Verify the operation with valid, unknown and cyclic centers. |
| 17:56 · 10:52:37 | Remove exports used only in their defining file. | Check the resolved whole-product graph, including configured consumers, types and public entry exports. A private helper and an advertised SDK symbol receive different verdicts. |
| 19:53 · 10:54:34, 22:05 · 10:56:46 and 27:00 · 11:01:41 | The repository specifies the query or operation, the resource adapter executes it, and the external contract schema may transform its record. | A contract adapter can compose a disk or HTTP adapter. An in-memory implementation satisfies the same ACL. The internal callback forwarding case is checked separately. |
| 22:42 · 10:57:23 | Keep comments that help the local reader and keep architectural rationale in specs and plans. | Apply the existing S20 question to a comment repeating the method and an explanation of a subtle constraint. |

## Next step

The person approved the plan and synthesis in Easel on 2026-11-18. Validate and commit the approved plan, exercise the procedure, verify and archive it, then integrate this change through the sequential runbook. Open the next family only after this one closes.
