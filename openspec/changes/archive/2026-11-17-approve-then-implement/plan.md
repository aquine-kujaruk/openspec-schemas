---
name: approve-then-implement
description: Every decision a change writes names who took it, the person's approval is the plan's last question and shows the artifacts themselves, in the person's language when one is configured, and an approved plan goes straight to the implementation the project configures
created_at: 2026-11-17
created_by: the person
approved_at: 2026-11-17
schema: spec-plan
---

# Approve, then implement

## Goal

Planning reads as one conversation: the agent writes the plan and the delta specs while it asks, and the last question is the person's approval, shown with links to the artifacts themselves rather than a summary. Every decision in them says who took it, the person or the agent, and keeps saying so once archived, for a later audit. Approving hands the change to the implementation at once, where the project says: in the same session by default, or through a command the project configures (another machine, a cloud agent). When a language is configured, every artifact of `openspec/` the agent shows the person (the plan, the delta specs, the decisions, the runbooks, the consolidated specs) is linked as a copy translated into that language, kept in the system's temporary folder; the repository stays in English.

## Findings

- The plan is already written before the person is asked anything and updated once per answer, on disk, so it survives a compacted conversation (`schemas/spec-plan/schema.ts` `planInstruction`; `openspec/specs/flow/plan/spec.md` "The first proposal is written before the person is asked anything", "Each answer updates the artifacts at once" @81f18b6, seen 2026-11-17).
- An answered question is recorded in its artifact and removed, so nothing records that the person took it; only a screen says who approved it (`@approved`, and a line under Decisions when the agent did) (`schemas/spec-plan/questions/ask-on-commitment.md`, `schemas/spec-plan/schema.ts` @81f18b6, seen 2026-11-17).
- Archived plans already sort their decisions by who took them in prose ("Asked by the person", "Proposed by the agent and accepted", "Assumptions of mine"), with nothing a tool can check (`openspec/changes/archive/2026-11-17-phases-in-one-run/plan.md` Decisions, seen 2026-11-17).
- The plan skill ends "Tell the person and stop: building it is the `implement` skill, in a run the person starts", and step 13 shows the open questions, not the artifacts (`schemas/shared/phases/plan/SKILL.md:37-39` @81f18b6, seen 2026-11-17).
- `phases-in-one-run` kept the stop after planning as a decision proposed by the agent and accepted by the person, a line under its Decisions, not an architecture decision (`openspec/changes/archive/2026-11-17-phases-in-one-run/plan.md`, seen 2026-11-17).
- The schema's `apply` text still says "one run builds the first phase of the plan that has unchecked tasks … and stops", against `phases-in-one-run` (`schemas/spec-plan/schema.ts` `apply` @81f18b6, seen 2026-11-17).
- Archiving keeps only `@env`, `@probed`, `@keys` on a procedure and `@applies`, `@enforced` on a decision; any other tag is dropped (`toolkit/flow/archive.ts:46-57` @81f18b6, seen 2026-11-17).
- The plan parser reads the open questions, the durable blocks, the screens and the phases; it reads neither the lines under `## Decisions` nor the plan's front matter (`toolkit/flow/plan.ts` `parsePlan` @81f18b6, seen 2026-11-17).
- The specification's converter keeps descriptive tags as backticked lines next to the heading they tag (`` `@credentials` `` above `### Requirement:`) and keeps them on conversion (`node_modules/opsx-gherkin/skills/opsx-gherkin/references/OPENSPEC_MDG_PROFILE.feature.md:8,46,59`, seen 2026-11-17).
- A project's `factory.config.ts` exports `ProjectConfig`: the overrides of its schema's defaults, `schema` and `products`; nothing says where a change is implemented (`toolkit/core/config.ts` @81f18b6, seen 2026-11-17).
- The feedback skill hands a ready change back to the implement skill once validation prints `ready` (`schemas/shared/phases/feedback/SKILL.md:23` @81f18b6, seen 2026-11-17).
- A backticked tag line directly above `### Requirement:` is reported by the specification tool as text "not carried into the main spec by archive", while one as the first line of the requirement's text validates (`pnpm exec factory openspec validate approve-then-implement`, seen 2026-11-17).
- Node's `os.tmpdir()` is the system's temporary folder (`/tmp` here), which the system empties; nothing of the factory writes there today (`toolkit/` @81f18b6, seen 2026-11-17).
- `flow/plan` and `flow/implement` have no step adapter; `flow/plan-validation` and `flow/archive` have one (`README.md` Work on this repository, `ls toolkit/flow/*.steps.ts` @81f18b6, seen 2026-11-17).

## Decisions

Asked by the person on 2026-11-17: "hay decisiones que toma el usuario y hay decisiones que toma el modelo … hacer anotaciones … para auditoría", "te pone el enlace para que tú abras el plan … no un resumen", "si el usuario le da simplemente a aprobar, ya empieza con la implementación … en la misma sesión … o en un servidor en Hong Kong", and agreed to the agent's proposal ("Sí, estoy de acuerdo contigo"), including the runner as `session` by default or a generic command.

- Who took a decision is the tag `@by:person` or `@by:agent`: on every line under Decisions, on the tag line of every architecture decision, procedure and screen, and on every requirement a delta spec adds or modifies. Discarded: sorting decisions under prose headings, which no tool checks. @by:person
- The approval is the last item of Open questions from the first proposal on, phrased as approving the plan with links to `plan.md`, each delta spec and each spike, and asked the way the agent asks the person anything. Approving records `approved_at: <date>` in the plan's front matter. Discarded: approval implied by the change validating ready. @by:person
- A requirement says who took it on the first line of its text, a backticked `` `@by:person` `` or `` `@by:agent` `` under `### Requirement:`, since the person asked for it "en las mismas specs". Discarded: the line above the heading, the converter's own form, which the specification tool drops on archive (see Findings); only the plan's Decisions, which leaves the spec silent. @by:agent
- Validation reports a change not ready until its plan carries `approved_at`. @by:agent
- An approval given together with other answers counts when those answers confirm the options the plan proposed; an answer that redirects the plan updates it and asks the approval again, with the links. Discarded: approving whatever the plan becomes after the answers. @by:agent
- An approved change goes to `pnpm exec factory handoff <change>` in the same turn, and the agent does what it prints. Discarded: the person starting another run. @by:person
- Where it is implemented is `implement.runner` at the top of `factory.config.ts`: `"session"` (the default) builds it in the same session with the implement skill; `{ command: "<shell command>" }` runs that command with `{change}` replaced by the change's name, and reaching the plan from there (pushing it, syncing the folder) is the command's job. Discarded: a list of known destinations. @by:person
- A change the plan phase opens on its own for a suspect runbook also waits for the person's approval. Discarded: letting the agent approve its own change. @by:agent
- A feedback taken into an approved change keeps its approval: feedback from the person is the person's direction, and feedback from a guard, verify or the archive changes no decision the person took without raising it as feedback to them. @by:agent
- Archiving keeps `@by` on every consolidated decision, procedure and requirement. @by:agent
- Asked by the person on 2026-11-17: "este link que me das aquí para revisar, que yo lo pueda ver en español … no la carpeta física … en una carpeta temporal … el plan, las especificaciones, los ADR, runbooks y todo lo consolidado … que lo haga un subagente pequeño … en low o en medium", naming no model. So a configured language turns every artifact of `openspec/` the agent shows the person into a link to a translated copy under the system's temporary folder. Discarded: translating the repository's files. @by:person
- The language is `language: "es"` at the top of `factory.config.ts`, and `FACTORY_LANGUAGE` in the person's environment or `.env` overrides it, so one person reads in another language without changing the project. Discarded: only the project's configuration, which imposes one language on every person. @by:agent
- `pnpm exec factory reading <paths…>` names each copy and whether it is stale; the copies live at `<tmpdir>/factory-reading/<language>/<repository folder name>-<short hash of its path>/<path in the repository>`, so two checkouts never share them. Discarded: the agent choosing paths on its own, which no test holds. @by:agent
- The translation is handed to a subagent on a small, fast model of whatever harness runs, at low or medium effort, naming no model. It translates prose and code comments and keeps in English the code, identifiers, file and repository names, tags (`@by:person`), the keywords SHALL, MUST, GIVEN, WHEN, THEN, AND, and the step comments. Only stale copies are translated again. @by:person
- The `apply` text of the schema is reworded to say a run builds every pending phase. @by:agent
- Version 0.13.0, after `publish-from-github` takes 0.12.0: the skills, the validator and the command change. @by:agent
- Approved by the person on 2026-11-17 as the plan proposed: "Vale, implementa ambos en orden". @by:person

## Open questions

## Architecture decisions

### Decision: decisions-name-who-took-them · Every decision a change writes says whether the person or the agent took it

@adds @area:product @topic:flow @applies:schemas,phases,toolkit @enforced:decision-authored @by:person

Every decision a change writes SHALL carry `@by:person` or `@by:agent`: each line under the plan's Decisions, each architecture decision, procedure and screen, and each requirement a delta spec adds or modifies. Validation SHALL report a change not ready while one lacks it, and archiving SHALL keep it in what it consolidates.

**Why** The person wants to audit later which decisions were theirs and which the agent's, inside the plan and the specs themselves.

**Alternatives** Prose headings in the Decisions section, as archived plans did: readable, never checked, and lost on the durable blocks once archived.

**Consequences** Every plan and delta spec carries one more tag per decision, and the consolidated trees carry it too.

### Decision: approve-then-implement · The person's approval is the plan's last question and starts the implementation where the project says

@adds @area:product @topic:flow @applies:phases,schemas,toolkit @enforced:plan-approved,handoff-spec @by:person

The plan SHALL end with the person's approval as its last open question, shown with links to the change's artifacts themselves. A change SHALL NOT be ready until its plan records that approval. Once approved, the change SHALL be handed in the same turn to the implementation the project configures: the same session by default, or a command the project names.

**Why** The person wants planning and implementing to read as one flow: approving should be one more answer, not a stop that waits for another run; and the person reads the plan itself, not a summary of it.

**Alternatives** Stopping once the change is ready and waiting for the person to start the implementation, as `phases-in-one-run` kept. Approval implied by readiness, which records nothing.

**Consequences** Nothing is implemented without a recorded approval, including the changes the agent opens on its own. A command runner must bring the change to wherever it runs.

### Decision: read-in-your-language · Artifacts are shown in the person's language and kept in English

@adds @area:product @topic:flow @applies:phases,toolkit @enforced:reading-spec @by:person

The artifacts of `openspec/` SHALL stay in English in the repository. When a language other than English is configured, by the project or by the person's environment, every artifact the agent shows the person SHALL be shown as a copy translated into that language, kept under the system's temporary folder and never in the repository, translated by a small, fast model, with code, identifiers, names, tags and the specs' keywords left in English.

**Why** The person reviews plans and specs in their own language, while the specs stay convertible and shared in one language.

**Alternatives** Writing the artifacts in the person's language: specs that differ by project and break the shared vocabulary. Translating with the main model: the same result at a higher cost.

**Consequences** A link the agent shows may point outside the repository, to a copy the system empties; it is written again when stale or missing. An edit made to a copy is lost: changes go through the agent to the English artifact.

## Procedures

## Screens

## Phases

### Phase 1: decisions name who took them, and a ready change is approved

**Seams**

```ts
// toolkit/flow/plan.ts
export type Plan = {
  // …as now, and:
  /** The lines under `## Decisions`, each with its tags. */
  changeDecisions: { text: string; tags: Tag[] }[];
  /** `approved_at` of the front matter, as written. */
  approvedAt?: string;
};
// toolkit/flow/validation.ts
export type Candidate = {
  // …as now, and:
  /** Each requirement a delta spec adds or modifies, with the tags on the first line of its text. */
  requirements: { spec: string; name: string; tags: Tag[] }[];
};
```

**Tests**

The generated tests of `flow/plan-validation` and `flow/archive` run the new rows through their step adapters; the adapters' baseline change is approved and authored, so every existing row keeps its outcome.

- [x] Read the Decisions lines and `approved_at` in `parsePlan`, and the tags on the first line of each added or modified requirement of the delta specs into the candidate
- [x] Add the rules `decision-authored` (exactly one of `@by:person`, `@by:agent` on every Decisions line, durable block, screen and added or modified requirement) and `plan-approved` (`approved_at` is a date) to the standard validator
- [x] Keep `@by` when archiving decisions and procedures (merged requirements keep it as part of their text)
- [x] Extend the step adapters of `flow/plan-validation` and `flow/archive`: an approved, authored baseline, and the steps of the new rows
- [x] Add `approved_at` to the plan template's front matter, `@by` to the template's comments for Decisions, decision, procedure and screen blocks, and the backticked `@by` line as the first line of the requirement's text in the spec template; say in the plan and spec instructions who each tag names
- [x] Verify the phase: `pnpm run check` passes

### Phase 2: approving hands the change to the implementation

**Seams**

```ts
// toolkit/core/config.ts
export type Runner = "session" | { command: string };
export type ProjectConfig = Overrides & { schema?: string; products?: Record<string, ProductEntry>; implement?: { runner?: Runner } };
// toolkit/flow/handoff.ts
/** factory handoff <change>: refuses a change that is not ready; prints the next step for `session`, runs the command otherwise. */
export const run: (args: string[]) => Promise<number>;
```

**Tests**

`toolkit/flow/handoff.feature.steps.ts` adapts `flow/handoff` over a temporary project whose runner command writes what it received to a file; the generated test runs it. `flow/plan` is proved by the person's word.

- [x] Write `toolkit/flow/handoff.ts` and register `handoff` in `toolkit/cli.ts`; add `implement.runner` to `ProjectConfig`
- [x] Write the step adapter `toolkit/flow/handoff.feature.steps.ts` for `flow/handoff`
- [x] Rewrite the plan skill: step 13 asks the open questions and, always last, the approval with a Markdown link to `plan.md`, each delta spec and each spike; an answer is recorded with `@by:person`; an approval records `approved_at` unless another answer redirected the plan; step 6's own change waits for approval too; the skill ends by running `pnpm exec factory handoff <name>` and doing what it prints, instead of stopping
- [x] Reword `ask-on-commitment.md` (an answered question becomes its decision with `@by:person`, every decision decided alone carries `@by:agent`), the flow instruction (an approved plan goes on to the implementation), the feedback skill's step 6 (an approved, ready change goes back to the implementation through `factory handoff`), and the schema's `apply` text (a run builds every pending phase)
- [x] Rewrite the flow's description in the docs (the README's flow paragraphs, or `docs/flow.md` once `publish-from-github` moved them) and document `implement.runner`; raise the package and command version to 0.13.0
- [x] Verify the phase: `pnpm run check` passes and the three packages build fresh

### Phase 3: artifacts are shown in the person's language

**Seams**

```ts
// toolkit/core/config.ts
export type ProjectConfig = Overrides & { /* …as phase 2, and: */ language?: string };
// toolkit/flow/reading.ts
export type Reading = { source: string; copy: string; fresh: boolean };
/** The reading copies of `paths` in the language the person's environment or the project names; none in English or with no language. */
export const readingsOf: (root: string, paths: string[], env?: NodeJS.ProcessEnv) => Promise<Reading[]>;
export const run: (args: string[]) => Promise<number>; // factory reading [--written] <paths…>
```

**Tests**

`toolkit/flow/reading.feature.steps.ts` adapts `flow/reading` over a temporary project and a temporary folder given as the system's; the generated test runs it. The translation by a subagent is proved by the person's word.

- [x] Write `toolkit/flow/reading.ts` and register `reading` in `toolkit/cli.ts`: one line per artifact, `<source> -> <copy> fresh|stale`; `--written` records each copy's source hash beside it once the translation is written
- [x] Write the step adapter `toolkit/flow/reading.feature.steps.ts` for `flow/reading`
- [x] Say in the flow instruction, and in the plan skill's approval step: before showing the person an artifact of `openspec/`, run `pnpm exec factory reading <paths…>`; when it names copies, hand the stale ones to a subagent on a small, fast model at low or medium effort with the rules of what stays in English, then run `pnpm exec factory reading --written <paths…>`, and link the copies instead of the artifacts
- [x] Document `language` and `FACTORY_LANGUAGE` next to `implement.runner`
- [x] Verify the phase: `pnpm run check` passes, the three packages build fresh, and `factory verify approve-then-implement --proved flow/plan` records the evidence

## Feedback

- Built on 2026-11-17 by the agent, after `publish-from-github`, at the person's request ("Vale, implementa ambos en orden").
- Found while building: feat2test reads a backticked value in a step as a literal with no input, so the delta specs put every such value in their Examples tables.
- Found while building: the shared fixtures of the step adapters (`toolkit/core/testing.ts`) write approved plans whose blocks and requirements say who took them, so every existing scenario keeps its outcome under the two new rules.
- Found while building: a consolidated block written before this change carries no `@by`; only the decisions a change writes from now on are checked.

## Next step

Implement it, after `publish-from-github`.
