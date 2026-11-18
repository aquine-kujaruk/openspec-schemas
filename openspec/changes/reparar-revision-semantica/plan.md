---
name: reparar-revision-semantica
description: Make the rubric review judge the product's own modules, prove every rubric row with recorded cases in Vitest, and keep the pending clean-core families as standing decisions.
created_at: 2026-11-18
created_by: the person
approved_at: 2026-11-18
schema: spec-plan
---

# Enforce the rubric the clean core already has

## Goal

`factory review` judges the modules the product declares and reports a run that judged nothing, rejected a row or lost the model as incomplete. Every rubric row is proven like a deterministic rule: a counterexample and a near miss in its layer's `examples.md`, judged by the decision model, recorded by `factory expect` and replayed by Vitest, with a score history that fails a degraded or ambiguous judgement. The patterns of the 2026-11-18 review are taught in the workstream skills, and the six pending clean-core families stand as architecture decisions awaiting their rule.

## Findings

- The defaults keep two independent module settings: `modules: "src/*"` and `review.modules: "src/*"` (`schemas/spec-plan/schema.ts`, `factory/quality/domain/schemas/audit-settings.schema.ts`). `factory.config.ts` sets only `modules: "factory/*"`, and the product catalog merges the `review` section with its default, so the review keeps `src/*` (`factory/engineering/infrastructure/adapters/product-catalog.adapter.ts`). Seen 2026-11-18.
- With `src/*` the review selected 0 of the 234 Factory files that `factory/*` selects, and the verification of `documentar-reglas-de-arquitectura` recorded `Run: 0 warning(s)` (its `evidence.md`). Seen 2026-11-18.
- The product vocabulary of `schemas/shared/cores/clean-core/review/RUBRIC.md` lists `return`; a term matches at the start of a word, so S05 (`return them`) and S17 (`returns its value`) are rejected as not generic and never asked (`factory/quality/domain/services/audit-rubric.service.ts`). Seen 2026-11-18.
- Rows marked `across files` (S07, S08, S11, S14) are never asked; the review prints them as left to the human reviewer (`factory/quality/application/use-cases/audit.use-case.ts`). Seen 2026-11-18.
- When the review fails, verify records it as `skipped` and the verdict ignores it, as `openspec/specs/factory/quality/inspect-work-order/spec.md` requires (`factory/quality/application/use-cases/inspect-work-order.use-case.ts`). Seen 2026-11-18.
- A deterministic case is `## <rule>` / `### <case>`, fenced files with their path, and an `expect` block of `- <path> (<tool>)` lines written by `factory expect`; feat2test generates its test and the steps call `examples(...).violations` from `factory/sdk` (`schemas/shared/cores/clean-core/workstreams/adapters/`). No rubric row has a case. Seen 2026-11-18.
- On 2026-11-18 the decision client got HTTP 200 from `gpt-6-luna` and returned 1 for a duplicated filter and 0 for a delegating one (`openspec/changes/archive/2026-11-18-documentar-reglas-de-arquitectura/plan.md`). How much the score of one case varies between runs has not been measured.
- Archiving consolidates a plan's architecture decisions into `openspec/adr` and its procedures into `openspec/runbooks`; its Feedback section stays in the archived plan only (`factory/production/application/use-cases/close-work-order.use-case.ts`). The six families agreed on 2026-11-18 live only in the Feedback table of `2026-11-18-documentar-reglas-de-arquitectura`. Seen 2026-11-18.
- Step 1 of `cambio-secuencial` reads active changes, worktrees, open PRs and the last closure; nothing in it reaches an older archived plan (`openspec/runbooks/operate/cambios.md`). Seen 2026-11-18.
- The person's review of the Factory implementation is capture `20261118-103440` (10:34–11:02); the decisions of this plan were taken in Easel on 2026-11-18.

## Decisions

- This change comes before the CLI family; discarded: the CLI family first (Astra's order) and a two-line patch inside the CLI family. @by:person
- Pending work is not tracked in Linear, which this project does not use. @by:person
- Vitest proves each rubric question with its cases; the product stays judged by `factory review`. Discarded: auditing every Factory file inside Vitest, and a fake client only. @by:person
- A semantic case is written in its layer's `examples.md` like a deterministic one, recorded by `factory expect` and tested by the feat2test-generated steps; the integration is a setup file, SDK steps and a reporter, not a Vite plugin. Discarded: a standalone Vitest plugin with a `toBeJudged` matcher. @by:person
- Without the key or the network a test replays the recorded judgement while the case's fingerprint (question, case files, model) matches; only a changed case calls the model, and without the key it fails. Discarded: always judging live, and skipping. @by:person
- A score between 0.15 and 0.85 is ambiguous and is not recorded. Discarded: a single cutoff at 0.85 or at 0.5. @by:person
- Each judgement joins a per-layer score history, and the report shows every case as stable, degraded, ambiguous or new; a degraded or ambiguous case fails, and the agent reruns it once before bringing the person a decision that names what changed (model, question or case). Discarded: a report that never fails, and the recorded verdict alone. @by:person
- A case is degraded when its score moves 0.2 or more from the mean of its history; Phase 4 revisits the cutoff with the measured variance. @by:agent
- The review reads the modules the product declares and the duplicate `review.modules` setting goes away; discarded: setting `review.modules` in `factory.config.ts`, which keeps two sources. @by:person
- The rubric vocabulary replaces `return` with `refund`, the product concept it meant; discarded: rewording S05 and S17, which leaves the collision for the next question. @by:agent
- Every file of a semantic case is part of the state the model judges, so cross-file rows are proven in Vitest from this change on. @by:agent
- `factory review` keeps leaving cross-file rows to the reviewer; the first family that needs one adds the bounded selection by imports agreed on 2026-11-18. Discarded: adding it here, which doubles the change. @by:agent
- The seven patterns are taught now in the workstream skills; each becomes a requirement under `openspec/specs/architecture` with the rule of the family that enforces it. Discarded: requirements with no rule behind them. @by:agent
- A rule is deterministic when the facts allow it; a rubric row only judges interpretation. @by:agent

- A configured review that is incomplete leaves the work order unverified until a complete run. With no configured key the audit is skipped. @by:person
- Phase 4 may call the production decision model to record approximately 40 case judgements and ten variance observations. @by:person

## Open questions

## Architecture decisions

### Decision: cli-composition-in-framework · Factory's CLI glue lives in its framework controllers

@adds @area:product @topic:clean-core @applies:factory @enforced:pending @by:person

Each Factory module SHALL have a controller in its framework layer that composes its use cases and translates arguments, hook payloads, standard input, output and exit status. A thin outer entry SHALL wire department dependencies and keep the public SDK and CLI commands. The framework SHALL NOT call static methods of the core directly.

**Why** Another transport, such as an internal API, must reach the same core operation and keep its decision; a direct call from the CLI hides the process from the core.

**Alternatives** Applying the convention to every backend schema now was discarded on 2026-11-18: it applies to Factory only.

**Consequences** The change that enforces it revises the layout decision and adds the rule. Acceptance: calling the same core operation from another transport preserves its decision.

### Decision: domain-hydrates-through-factory · The use case hydrates once through a domain factory

@adds @area:product @topic:clean-core @applies:factory @enforced:pending @by:person

A Factory repository SHALL return validated data, and the use case SHALL call a domain factory once to obtain the complete aggregate. The domain SHALL own the error for a missing required part, and SHALL keep the optional lookup for callers that accept absence.

**Why** The capture showed `PlantRepositoryImplementation` building `Plant` and `PrepareLineUseCase` handling a missing line itself.

**Alternatives** Hydrating in the repository was discarded: rows S05 and S19 stay.

**Consequences** Acceptance: a missing required line produces the same domain error from every caller.

### Decision: domain-contracts-execute · A schema in the domain validates at runtime

@adds @area:product @topic:clean-core @applies:factory @enforced:pending @by:person

A Factory domain contract named as a schema SHALL be an executable validation with its inferred type, reused at the boundary when the shapes match. A class SHALL carry its role in its exported name as well as in its file name.

**Why** TypeScript-only aliases in schema files passed for validation, and 34 domain classes lacked the role their scaffold names.

**Alternatives** Type-only contracts were discarded.

**Consequences** Acceptance: an order with a string in its boolean `builds` field is rejected, and the checker recognizes an aggregate suffix on the exported class.

### Decision: branch-by-responsibility · A branch lives with the responsibility it decides

@adds @area:product @topic:clean-core @applies:factory @enforced:pending @by:person

A branch that decides a domain policy SHALL live in the domain; a branch in a use case SHALL only coordinate whether to perform I/O.

**Why** A use case reads as orchestration; a policy branch inside it is a hidden state machine.

**Alternatives** Moving every branch out of application was discarded: the I/O decision belongs there.

**Consequences** Acceptance: for a path the write policy already resolved, the work-order repository is never called.

### Decision: process-owns-topology · The Process aggregate owns ordering and cycles

@adds @area:product @topic:clean-core @applies:factory @enforced:pending @by:person

A work center SHALL describe its direct dependencies; the Process aggregate SHALL own ordering and cycle detection across centers, and both the runtime loader and the domain SHALL use that one calculation. Value objects of a single value SHALL become validated fields of their owner's schema.

**Why** `WorkCenter` was anemic while `Process` and `WorkCenterTopologyService` each traversed the graph; `WorkCenterId` and `StandardId` wrap a string.

**Alternatives** Keeping a topology domain service was discarded: a service is the last resort after an instance or a static method.

**Consequences** Acceptance: A → B → A is detected by one implementation, with valid, unknown and cyclic centers verified; the valid empty name of the implicit line is preserved.

### Decision: internal-ports-composed-directly · An adapter wraps an external system; internal ports are composed

@adds @area:product @topic:clean-core @applies:factory @enforced:pending @by:person

A Factory adapter SHALL wrap an external system (a package, an API, the disk). The composition root SHALL connect an internal port such as change control to the production operation, adapt its result to the validated consumer contract and keep its error semantics. The repository SHALL state the operation or query, a generic resource adapter SHALL execute it, and a contract adapter MAY compose a disk or HTTP adapter and transform the record with the contract schema.

**Why** Adapters that forwarded an internal callback, such as `ReleasedWorkOrderAdapter.readStarted()`, are not glue to anything external.

**Alternatives** Keeping internal callbacks as adapters was discarded.

**Consequences** The rule pairing resource ACLs with adapters must tell internal ports apart; the valid HTTP, disk and in-memory cases are checked too.

## Procedures

### Procedure: cambio-secuencial · Abrir, integrar y cerrar un cambio de este repositorio

@modifies:cambio-secuencial @base:2026-11-17-serializar-cambios @purpose:operate @topic:cambios @env:local,prod @by:person

**When** Al recibir una intención nueva o retomar una integración interrumpida.

**Requires** Git, el acceso `github-personal` y las herramientas de OpenSpec del repositorio.

**Steps**

1. Antes de explorar, trae las referencias de `origin` y revisa los cambios OpenSpec activos, los worktrees, los PR a `main` y el último cierre. Si queda un cambio en curso, retómalo en su rama desde la primera operación pendiente. Mantén la intención nueva en espera, incluso si al cambio anterior solo le falta el tag o la actualización local. En la adopción se toma el `main` vigente como punto de partida. Lista también las decisiones de `openspec/adr` marcadas `@enforced:pending` (`grep -rl "@enforced:pending" openspec/adr`). Si no hay intención nueva, propón a la persona la primera pendiente como siguiente cambio.
2. Con el ciclo anterior cerrado, actualiza `main` local por fast-forward desde `origin/main`. Comprueba que sus SHA coinciden y que el árbol está limpio. Crea desde ese SHA una rama propia del cambio. Explora ahí y redacta su plan OpenSpec. Presenta el plan y espera aprobación para implementarlo.
3. Al recibir la aprobación, regístrala en el plan y valida el cambio. Cuando esté listo, haz el primer commit con el plan aprobado y sus artefactos OpenSpec. Comprueba que `git status --porcelain` devuelve una salida vacía antes de empezar la implementación. Si retomas el cambio en otra sesión, localiza su rama y el commit del plan aprobado.
4. Implementa el plan. Durante la ejecución, edita el plan solo para marcar tareas completadas o incorporar feedback registrado en el propio cambio. Verifica el resultado, archiva el cambio y revisa lo consolidado. Si el cambio aplica una decisión pendiente, cambia su `@enforced:pending` por la regla o el check que ahora la sostiene. Haz el segundo commit con la implementación, la evidencia, los artefactos archivados y las actualizaciones consolidadas.
5. Comprueba que la rama aporta esos dos commits a `main` y está limpia. Súbela, abre el PR y fusiónalo conservando ambos commits cuando se cumplan las comprobaciones y aprobaciones requeridas. Si ya existe el PR, continúa con él. Recupera de GitHub el SHA de integración del PR fusionado y confirma que pertenece a `origin/main`.
6. Trae los tags remotos. Si el SHA ya tiene su etiqueta `change-vX.Y.Z`, reutilízala. Si falta, incrementa el parche del mayor tag de cambio por versión numérica. Para el primer tag, usa como base el último `vX.Y.Z` alcanzable desde el merge. Crea la etiqueta en el **SHA de integración del PR** y súbela. Si el nombre ya pertenece a otro SHA, vuelve a leer las referencias y recalcula. Conserva los tags publicados.
7. Vuelve a `main`, actualízalo por fast-forward y verifica el cierre. Si falla un paso, reanuda ese mismo cambio. La siguiente exploración empieza después de verificar el cierre.

**Verification** El PR figura como fusionado y en el historial de `main` se pueden consultar por separado el plan aprobado y el cierre del cambio. El cambio está en `openspec/changes/archive/` y sus resultados consolidados están en `main`. El tag remoto apunta al SHA de integración. `git rev-parse main origin/main` devuelve dos SHA iguales, el árbol está limpio y no queda otro cambio activo. Las decisiones pendientes que quedan se listan en el paso 1 de la siguiente sesión.

### Procedure: maintain-architecture-rules · Read, change and verify a Clean Core rule

@modifies:maintain-architecture-rules @base:2026-11-18-documentar-reglas-de-arquitectura @purpose:operate @topic:architecture-rules @env:local @by:person

**When** A maintainer investigates a diagnostic or adds, tightens, relaxes or retires an architectural rule.

**Requires** This repository with its dependencies. Deterministic and semantic cases run with Vitest. Recording a semantic case, or rerunning one whose fingerprint changed, uses the model and key variable configured for the project; the current default reads `OPENAI_API_KEY` from `.env` and uses `gpt-6-luna`.

**Steps**

1. Locate the layer and its requirement under `openspec/specs/architecture/<layer>/spec.md`, or the rubric row under the core's or schema's `review/RUBRIC.md`. Search the slug or row id under `schemas/shared/cores/clean-core/workstreams/` or in the framework workstream of its owning schema. Read the requirement, the rule in `<layer>.rules.ts` or the row's question, its cases and their recorded `expect` blocks in `<layer>.examples.md`, and the valid reference in the same file. For example, `acl-adapter-paired` has an `acl-without-adapter` case: ArchUnit identifies `src/module/infrastructure/acl/invoice.acl.ts`.
2. Follow the sequential change runbook. In the delta, give the rule a stable slug. Show the smallest case that breaks it and the closest valid case. Include the imported files for checks that resolve imports. For a relaxed rule, exercise the newly accepted example and a nearby violation that should still fail. For a retired rule, remove its requirement, registration, cases and outcome together, and verify neighbouring rules.
3. Choose a reproducible check where the facts permit it. Fallow can examine references across resolved files, Oxlint can inspect syntax, imports and globals, and ArchUnit can check conventions and relationships specific to the architecture. Keep a rubric row for what only interpretation decides. Reproduce the missed violation before changing the check, and keep a legitimate near miss in the reference.
4. For a deterministic rule, add the check in the owning layer and run `pnpm exec factory generate` and `pnpm exec factory expect <layer>`. Inspect the recorded diff: the new example must identify the intended file and tool.
5. For a rubric row, write its binary question and, under `## <row> · <slug>` in the layer's `examples.md`, a counterexample and a closely matched valid case with every file the judgement needs, such as two independent cycle detections against one detection and a caller that delegates to it. Run `pnpm exec factory expect <layer>`: it judges each case with the model and records verdict, score and fingerprint. A case reported ambiguous (score between 0.15 and 0.85) is not recorded: sharpen the case or the question and record again.
6. Run the generated Vitest suite for the layer, the slug/case consistency tests and `pnpm exec factory check` on Factory, then `pnpm exec factory review` with the key set. Read the judgement report: a degraded case is rerun once; if it stays degraded, name what changed (model, question or case) and bring the decision to the person. A review that reports itself incomplete is rerun once the cause is fixed. Follow the configuration through the consuming schema and the built package; Clean Core is shared by clean-backend and clean-react.
7. Resolve findings within the existing workflow: the person decides at planning or reviews and gives feedback at verification. Record a correction or an evidenced justification for every review warning before closing.

**Verification** A second maintainer can find the slug or row, reproduce the recorded diagnostic or judgement and verify the valid reference. `pnpm test` passes with the key unset while no case changed. The evidence names the review as complete and lists the disposition of every warning.

## Screens

## Phases

### Phase 1: The review judges the product's modules and says when it is incomplete

**Seams**

```ts
// factory/shared/domain/schemas/line-types.schema.ts: the review keeps no modules of its own
export type Review = {
  keyVariable: string;
  model: string;
  threshold: number;
  spanLines: number;
  batch: { files: number; chars: number };
};

// factory/quality/application/use-cases/audit.use-case.ts
export type AuditInput = { root: string; modules: string; config: Review; rubrics: string[]; key?: string };
export type AuditReport =
  | { code: 0; findings: AuditFinding[]; lines: string[] }
  | { code: 2 | 3; issue: string }
  | { code: 4; incomplete: string[]; findings: AuditFinding[]; lines: string[] };
```

**Tests**

- The generated acceptance tests of `factory/quality/audit`: modules `factory/*` and `src/*` judge their own files; no core file selected, a rejected row and a failed model call report incomplete with status 4.
- The generated acceptance tests of `factory/quality/inspect-work-order`: a configured key with an incomplete review leaves the change not verified; an absent key stays skipped and verified.
- The rubric unit tests: S05 and S17 load as accepted with the new vocabulary.

- [ ] Remove `review.modules` from the defaults, the review type and the product catalog; pass the product's `modules` to the audit
- [ ] Replace `return` with `refund` in the product vocabulary of the clean-core and clean-react rubrics
- [ ] Report the review incomplete with status 4, naming each cause, when no core file is selected in a product that has core files, a row is rejected or the model call fails
- [ ] Record an incomplete review in the evidence and report the change not verified when the key is configured
- [ ] Verify the phase: `pnpm run typecheck && pnpm exec factory generate --check && pnpm run test`, then `pnpm exec factory review` on Factory judges more than zero files

### Phase 2: A rubric row is proven by its recorded cases in Vitest

**Seams**

```ts
// factory/sdk.ts
export type Judgement = {
  verdict: "yes" | "no" | "ambiguous";
  score: number;
  model: string;
  fingerprint: string; // question + every file of the case + model
};
export const judgements: (layer: string, dir: string) => {
  judge(row: string, caseName: string): Promise<Judgement>;
  recorded(row: string, caseName: string): Judgement | undefined;
};
// a judged case's expect block:
// - <path> (luna yes 0.97 · <fingerprint>)     or     (no findings) (luna no 0.03 · <fingerprint>)
```

**Tests**

- The linting acceptance tests for recorded, replayed, changed and ambiguous judgements, over a fixture decision client.
- The example-parser tests: a `## S17 · <slug>` heading is a rubric row whose cases are judged, and every file of a case reaches the client.

- [ ] Parse a rubric row heading in `<layer>.examples.md` and judge its cases with every file of the case as the state
- [ ] Make `factory expect <layer>` judge rubric cases with the configured model and key, record verdict, score and fingerprint, and list an ambiguous case without recording it
- [ ] Add the SDK steps the generated tests use: replay a matching fingerprint without the model, judge a changed case when the key is present, fail naming `factory expect` when it is absent
- [ ] Add the Vitest setup file that loads the key from `.env` without printing it
- [ ] Verify the phase: `pnpm run typecheck && pnpm exec factory generate --check && pnpm run test`

### Phase 3: Every judgement joins a score history the report reads

**Seams**

```ts
// <layer>.scores.json next to <layer>.examples.md
type ScoreHistory = Record<string, { score: number; model: string; question: string; case: string; date: string }[]>;
type CaseState = "stable" | "degraded" | "ambiguous" | "new";
```

**Tests**

- The linting acceptance tests for the report: a stable, a degraded (|Δ| ≥ 0.2 from the history's mean), an ambiguous and a new case, and the failure of the degraded and the ambiguous one.

- [ ] Append every judgement to `<layer>.scores.json` with its model and the fingerprints of question and case
- [ ] Add the Vitest reporter that prints, per layer, case, history, score now, Δ and state, and fail a degraded or ambiguous case
- [ ] Verify the phase: `pnpm run typecheck && pnpm exec factory generate --check && pnpm run test`

### Phase 4: The clean core's rubric rows have recorded cases

**Tests**

- The generated suites of every layer that holds a rubric row now replay its counterexample and its near miss.

- [ ] Judge S17 `wrapper-id` and its reference five times each; record the spread under Findings and revisit the 0.2 cutoff when the spread exceeds 0.1
- [ ] Give every clean-core rubric row a counterexample and a near miss in the `examples.md` of the layer it is asked over (cross-file rows in the layer of their main object); S17 contrasts the `WorkCenterId` wrapper with a `Money` that adds and formats
- [ ] Do the same for the clean-react rubric rows
- [ ] Record every case with `pnpm exec factory expect`
- [ ] Verify the phase: with `OPENAI_API_KEY` unset, `pnpm run test` replays every case and passes

### Phase 5: The patterns are taught and the families wait as decisions

**Tests**

- None new: the skills are prose, and the decisions and procedures are consolidated on archive.

- [ ] Teach patterns 1–5 and 7 in the `app-domain`, `adapters` and `infrastructure` skills, each naming the rubric row or rule that holds it: delegate to the closest owner; the use case orchestrates; a value object groups several attributes with meaning and behaviour; a domain service is the last resort; an adapter wraps an external system and the repository states the operation; nothing public without a consumer and every class names its role
- [ ] Verify the phase: `pnpm exec factory check` passes on Factory, and `pnpm exec factory review` with the key set runs complete and its warnings are recorded in the evidence

## Feedback

## Next step

Commit the approved plan and implement every phase in order.
