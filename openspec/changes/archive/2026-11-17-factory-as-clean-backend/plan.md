---
name: factory-as-clean-backend
description: The factory becomes a clean-backend line checked by factory check, its modules the departments of a plant and its code in the language of The Goal and The Phoenix Project
created_at: 2026-11-17
created_by: the person
approved_at: 2026-11-17
schema: clean-backend
---

# The factory as a clean-backend line

## Goal

`factory/` is a line of this plant manufactured with the clean-backend process, and `pnpm exec factory check` passes on it with the frozen command. Its modules are the departments a plant has (production, engineering, quality, change control, maintenance, and what they share), each with real entities, value objects and use cases named in the plant's language. Its drawings live under `openspec/specs/factory/<module>/<use-case>`, their gauges under `test/acceptance/<module>/`, and every other test of the factory under `test/unit` or `test/integration`; the tests of this repository's schemas live in `test/schemas/`, outside the line. Nothing a person or an agent runs changes: the same commands, the same output.

## Findings

- `pnpm exec factory check` on `factory/` as Codex laid it out reports 239 `every-file-in-a-zone`, 15 `no-environment`, 13 `no-raw-error-in-core`, 6 `no-any-in-core`, 5 `no-magic-closed-set-strings` and 3 `infrastructure-throws-domain-exceptions`: domain and application hold loose files (`*Ports` types, a fake client, CLI options), and `framework/` is no zone of clean-backend (worktree, seen 2026-11-17).
- 15 files import another module: flow → repository 6, package → flow 5, package → repository 3, architecture → repository 1; what they share is products, the changes in implementation, validation, generated tests, the schema and the installed package (`grep` of `factory/*/`, seen 2026-11-17). The clean core's `modules-are-isolated` forbids any of them.
- The modules `repository`, `flow`, `architecture` and `package` were named after the areas of `openspec/specs` by the agent, without a domain discovery (`2026-11-17-factory-in-clean-core`, decision "core/ becomes shared/…", seen 2026-11-17).
- Ten drawings have code in `factory/`: `flow/{archive,feedback,handoff,reading,verify}`, `architecture/review`, `package/{completion-gate,setup,write-guard}`, and `package/install`, whose steps run `install.sh` from the repository's root (`factory/package/install.feature.steps.ts:17`, seen 2026-11-17).
- About 31 hand-written tests sit next to the code; most import the composition files (`architecture.ts`, `flow.ts`) or the disk, and about 12 prove this repository's schemas rather than the command (`rule-ids`, `scaffolds`, `case-ids`, `holders`, `core`, `module-rules`, `reference`, `factory`, `record-findings`, `markup`, `products-check`, `e2e`) (`find factory -name '*.test.ts'`, seen 2026-11-17).
- With the line at the repository's root, the zones report `schemas/`, `packages/`, `tools/` and `openspec/` unless `factory.config.ts` ignores them; the whole-product checks honor `ignore` only once `whole-product-checks-honor-ignore` is archived and the frozen command rebuilt (seen 2026-11-17).
- OpenSpec retires a capability whose last requirement a change removes only when the change's `.openspec.yaml` holds `retire_capabilities: true` (`@fission-ai/openspec` `dist/core/archive.js`, seen 2026-11-17).
- The person's language for a plant comes from *The Goal* (Goldratt) and *The Phoenix Project*: work orders flowing through work centers toward a constraint, quality control in front of the constraint, the andon cord (domain discovery with the person, 2026-11-17).

## Decisions

- The domain was discovered with the person before planning, as a light event storming whose taxonomy is the plant's; the glossary and the departments are this plan's architecture decisions, and no `CONTEXT.md` or context map is written. @by:person
- The nine drawings with code in `factory/` move to `openspec/specs/factory/<module>/<use-case>`, renamed in the plant's language: `flow/archive` → `production/close-work-order`, `flow/feedback` → `production/pull-andon`, `flow/handoff` → `production/dispatch-work-order`, `flow/reading` → `production/make-reading-copies`, `flow/verify` → `quality/inspect-work-order`, `architecture/review` → `quality/audit`, `package/completion-gate` → `quality/hold-stage`, `package/write-guard` → `change-control/authorize-write`, `package/setup` → `maintenance/maintain-equipment`; their text is unchanged but for `inspect-work-order`, where the factory's own drawings are now read from the acceptance root. Discarded: keeping the old capability names, which name areas, not use cases. @by:person
- `package/install` stays where it is: it proves `install.sh`, which no line holds; its gauge and fixture move to `tools/`, next to `build` and `release`. @by:agent
- The commands keep their names and their output (`factory archive`, `factory verify`, `factory guard`…): only the code speaks the plant's language. Discarded: renaming the commands, a change every installed project would meet. @by:agent
- The line is configured in `factory.config.ts`: `modules: "factory/*"`, `entry: ["factory/*.ts"]`, `productSpecs: "openspec/specs/factory/*/*/spec.md"`, and `ignore` for `schemas/**`, `packages/**`, `tools/**`, `openspec/**`, `docs/**`, `dist/**` and `test/schemas/**`. @by:person
- The tests of this repository's schemas move to `test/schemas/`, which the line ignores. @by:person
- `factory/sdk/index.ts` becomes the entry file `factory/sdk.ts`, still exported as `factory/sdk`; a folder `sdk/` would be read as a module without layers. @by:agent
- Every existing hand-written test goes to `test/unit` (domain or application only, no disk), to `test/integration` (a repository implementation), to a gauge's scenario (when a drawing already covers it) or to `test/schemas`; none is deleted without the plan's Feedback naming what proves it now. @by:agent
- A use case that needs another department declares a repository interface for it and the entry hands it the other department's use case behind an implementation; no module imports another. @by:person
- The phases go department by department in dependency order, each closed by `factory check --module <module>` and the gauges of its drawings; the old folders empty as their code moves, and the last phase removes them. @by:agent
- The implementation runs in the worktree with the frozen command, rebuilt after `whole-product-checks-honor-ignore` is archived; that change is archived before this one is released. @by:agent

## Open questions



## Architecture decisions

### Decision: factory-speaks-the-plant-language · The factory's code speaks the language of a plant

@adds @area:product @topic:language @applies:factory @enforced:review @by:person

The factory's code, its plans and its decisions SHALL name its concepts with these terms, taken from *The Goal* and *The Phoenix Project* and, where the books are silent, from a plant's vocabulary, and SHALL NOT use the words each term avoids. The commands a person or an agent types keep their names.

| Term | What it is | Avoid |
| --- | --- | --- |
| Work order | A unit of work a person asks for, from its opening to its closing; OpenSpec stores it as a change | change, ticket |
| Release | The constraint approving a work order's plan, which lets it into production | approval |
| Stage · Operation | A part of a work order worth having on its own · one step of a stage | phase · task |
| Andon | The signal anyone pulls when work misses its drawing or a decision is missing; the work order goes back to planning | feedback, non-conformance |
| Inventory · Throughput | The work orders open · the work orders closed | backlog · velocity |
| Constraint | The person who releases work orders and reviews what comes out, the resource that sets the plant's pace | user, reviewer |
| Operator | The agent that does the operations of a stage | agent, implementer |
| Process · Base process | How a line manufactures: work centers, parts, standards · a process others extend | schema · core |
| Work center | A part of a process that makes some parts and is checked on its own | workstream, station |
| Part · Standard | A kind of file a work center makes · a rule a part meets | layer · rule |
| Sample · Golden sample | Parts showing one way of breaking a standard · the parts that break none | example · reference module |
| Drawing · Drawing revision · Current drawing | The behaviour a use case must show · how a work order changes it · what stands | spec · delta spec · consolidated spec |
| Gauge · Fixture | A test made from a drawing · the code that connects it to the use case | generated test · step adapter |
| Quality control · Defect | Measuring the work against standards and gauges in front of the constraint, holding the operator until it passes · one place that breaks a standard | check, gate · finding |
| Final inspection · Quality certificate | Proving a whole work order · the record it leaves | verify · evidence |
| Audit | A review against a rubric by a decision model, whose warnings fail nothing | rubric review |
| Plant · Line · Module | The project · a folder one process manufactures · a context of what a line makes | project · product · feature |
| Equipment · Work instruction | What a plant installs: command, processes, work instructions, controls · a written procedure an operator follows | installed package · skill |
| Change control · Maintenance | Letting an operator write only what a released work order allows · checking and repairing the equipment | write guard · setup, doctor |

**Why** The person reads a plant better than a pipeline, and the books explain why the factory exists: the constraint is the person, so quality control stands in front of them and only good work reaches them.

**Alternatives** A Lean/Toyota vocabulary (station, poka-yoke, quality gate, non-conformance): accurate but technical, and it loses the constraint. The words the code used before: areas of the specs, not a domain.

**Consequences** Every new name in `factory/` is a term of this table; a word under Avoid in a new name is a review warning. The table grows only through a change.

### Decision: factory-departments · The factory's modules are the departments of a plant

@adds @area:product @topic:modules @applies:factory @enforced:modules-are-isolated @by:person

The factory's modules SHALL be `production` (opens, releases, dispatches, stages and closes work orders, takes in andon pulls), `engineering` (processes, work centers, parts, standards, samples; prepares a line), `quality` (gauges from drawings, quality control, final inspection, audit, holding a stage), `change-control` (what an operator may write) and `maintenance` (the plant's equipment), with `shared` holding only what every department names: plant, line, module, process name. No module SHALL import another: a use case that needs another department declares a repository interface, and the entry hands it the other department's use case.

**Why** Each department changes for its own reasons and speaks its own part of the language; the 15 imports across the old modules came from boundaries drawn by folder, not by department.

**Alternatives** The areas of `openspec/specs` (repository, flow, architecture, package): one of them a grab bag, and four cycles to break by hand. Change control inside production: one module less, but production would mix planning work orders with blocking operators.

**Consequences** Production → quality: a stage closes when quality control passes, a work order closes after its final inspection. Quality → production: a failed final inspection pulls the andon. Engineering → quality: quality control measures against the line's process. Production → change control: change control reads which work orders are released. Maintenance → engineering: maintenance links the processes the equipment brings. Each of these crosses through the entry.

### Decision: factory-is-a-clean-backend-line · The factory is a clean-backend line checked by factory check

@replaces:factory-in-clean-core-layers @base:2026-11-17-factory-in-clean-core @area:product @topic:layout @applies:factory,tools,schemas,packages @enforced:factory-check @by:person

The command's code SHALL be a line of this plant manufactured with the clean-backend process: `factory/<module>/` holds only what the process's work centers make, the entry files sit directly under `factory/` (`main.ts`, one composition file per module, and `sdk.ts`, the only part `schemas/` and `packages/` import, as `factory/sdk`), and the tests sit in `test/acceptance/<module>/`, `test/unit/<module>/` and `test/integration/<module>/`. `pnpm exec factory check` SHALL pass on it. What only this repository runs SHALL live in `tools/`, which no package carries, and the tests of this repository's schemas in `test/schemas/`, which the line ignores. In a decision written before this one, `@applies:toolkit` means `factory/`.

**Why** The factory teaches the clean core; held by the same standards it gives every line, its own code cannot drift into a domain that models nothing, as it did when only a hand-written layout test held it.

**Alternatives** The clean core's layers without its standards, held by `layout.test.ts`: it let the domain hold ports, fakes and CLI options. Two lines, the factory and the schemas: every change touching both would split in two.

**Consequences** `layout.test.ts` goes. The commands and hooks move from each module's `framework/` to the entry. In the worktree the checker is the frozen command; in this repository's `main`, where `factory` links to itself, it is the live code.

## Procedures

## Screens

## Phases

### Phase 1: The line is laid out and shared and engineering are modelled

**Seams**

```ts
// factory/shared/domain
export class Plant /* entity */ { readonly root: string; readonly lines: Line[] }
export class Line /* entity */ { readonly name: LineName; readonly folder: string; readonly process: ProcessName; readonly roots: LineRoots }
export class LineName /* value object */ {}
export class ProcessName /* value object */ {}          // clean-backend, clean-react, spec-plan
export class LineRoots /* value object */ {}            // modules, entry, acceptance, unit, integration, e2e, ignore
export class PlantException extends DomainException {}

// factory/engineering/domain
export class Process /* aggregate */ { readonly name: ProcessName; readonly base?: ProcessName; readonly workCenters: WorkCenter[] }
export class WorkCenter /* entity */ { readonly id: WorkCenterId; readonly parts: Part[]; readonly waitsFor: WorkCenterId[] }
export class Part /* value object */ { readonly name: string; readonly standards: Standard[] }
export class Standard /* value object */ { readonly id: StandardId; readonly title: string }
export class Sample /* value object */ { readonly standard: StandardId; readonly files: Map<string, string>; readonly expected: Defect[] }

// factory/engineering/application
export interface ProcessRepositoryInterface { findProcess(name: ProcessName): Promise<Process | null>; listProcesses(): Promise<Process[]> }
export interface PlantRepositoryInterface { getPlant(): Promise<Plant> }
export class ListProcessesUseCase { execute(): Promise<Process[]> }          // factory schemas
export class PrepareLineUseCase { execute(line: LineName): Promise<string[]> } // factory prepare
```

**Tests**

- `factory check --module shared` and `factory check --module engineering` pass.
- The unit tests of `Process`, `WorkCenter` (run order, upstream, what may run together, from `graph.test.ts`) and `LineRoots`, under `test/unit/engineering/` and `test/unit/shared/`.
- The tests of this repository's schemas, moved to `test/schemas/`, pass unchanged in what they assert.

- [x] modules: move `factory/sdk/index.ts` to `factory/sdk.ts`, delete `factory/shared/application/layout.test.ts`, and move the tests of this repository's schemas to `test/schemas/` and `package/install`'s gauge and fixture to `tools/`, pointing `vitest.config.ts` at them
- [x] app-domain: model `shared` (plant, line, roots, process name) and `engineering` (process, work center, part, standard, sample) from their scaffolds, with their unit tests
- [x] infrastructure: read the plant from `factory.config.ts` and the processes from their definitions behind `acl/` and `repository-implementations/`, with their integration tests
- [x] adapters: the file system, the module loader and the environment as resource adapters of `shared`
- [x] modules: compose `engineering` in `factory/engineering.ts` and register `schemas` and `prepare` in `main.ts`, with the same output as today
- [x] modules: verify the phase: `pnpm exec factory check --module shared`, `pnpm exec factory check --module engineering`, `pnpm exec factory test unit`, `pnpm exec factory test integration`

### Phase 2: Production

**Seams**

```ts
// factory/production/domain
export class WorkOrder /* aggregate */ {
  readonly name: WorkOrderName; readonly process: ProcessName; readonly line?: LineName;
  readonly plan: Plan; readonly revisions: DrawingRevision[]; readonly andonPulls: AndonPull[];
  release(on: Day): void; startNextStage(): Stage; close(on: Day): ClosedWorkOrder;
}
export class Plan /* entity */ { readonly stages: Stage[]; readonly decisions: Decision[]; readonly openQuestions: string[]; readonly releasedOn?: Day }
export class Stage /* entity */ { readonly title: string; readonly operations: Operation[] }
export class Operation /* value object */ { readonly workCenter?: WorkCenterId; readonly text: string; readonly done: boolean }
export class Decision /* value object */ { readonly text: string; readonly by: DecidedBy }   // person | agent
export class AndonPull /* value object */ { readonly from: string; readonly names: string; readonly says: string }
export class DrawingRevision /* value object */ { readonly drawing: DrawingPath; readonly requirements: RequirementChange[] }
export class WorkOrderName /* value object */ {}
export class WorkOrderException extends DomainException {}

// factory/production/application
export interface WorkOrderRepositoryInterface { findWorkOrder(n: WorkOrderName): Promise<WorkOrder | null>; listWorkOrders(): Promise<WorkOrder[]>; saveWorkOrder(o: WorkOrder): Promise<void> }
export interface StandingRecordRepositoryInterface { consolidate(o: ClosedWorkOrder): Promise<void> }   // current drawings, decisions, procedures
export interface FinalInspectionRepositoryInterface { findCertificate(n: WorkOrderName): Promise<QualityCertificateSummary | null> } // quality, through the entry
export class ValidateWorkOrderUseCase {}      // factory validate
export class StartStageUseCase {}             // factory implement
export class DispatchWorkOrderUseCase {}      // factory handoff       · drawing production/dispatch-work-order
export class MakeReadingCopiesUseCase {}      // factory reading       · drawing production/make-reading-copies
export class PullAndonUseCase {}              // factory feedback      · drawing production/pull-andon
export class CloseWorkOrderUseCase {}         // factory archive       · drawing production/close-work-order
export class ListReleasedWorkOrdersUseCase {} // read by change control and quality through the entry
```

**Tests**

- The gauges of `production/close-work-order`, `production/pull-andon`, `production/dispatch-work-order` and `production/make-reading-copies`, generated into `test/acceptance/production/`, with the fixtures of `flow/archive`, `flow/feedback`, `flow/handoff` and `flow/reading` moved beside them.
- The unit tests of `WorkOrder` (release, stages in order, closing), from `archive.test.ts` and `implement.test.ts`.
- The integration test of the work order repository over an in-memory adapter typed by its ACL.

- [x] app-domain: model the work order, its plan, stages, operations, decisions, andon pulls and drawing revisions from their scaffolds, and the use cases above, with the fixtures moved to `test/acceptance/production/`
- [x] infrastructure: the work orders, the current drawings, decisions and procedures read and written behind `acl/` and `repository-implementations/`, with their integration tests
- [x] adapters: the change folders, git and the specification tool as resource adapters
- [x] modules: compose `production` in `factory/production.ts`; register `validate`, `implement`, `handoff`, `reading`, `feedback` and `archive` in `main.ts` with the same output as today
- [x] modules: verify the phase: `pnpm exec factory check --module production`, `pnpm exec vitest run test/acceptance/production`, `pnpm exec factory test unit`, `pnpm exec factory test integration`

### Phase 3: Quality

**Seams**

```ts
// factory/quality/domain
export class Drawing /* entity */ { readonly path: DrawingPath; readonly scenarios: Scenario[] }
export class Gauge /* value object */ { readonly drawing: DrawingPath; readonly file: string }
export class Defect /* value object */ { readonly file: string; readonly standard: StandardId; readonly tool: InspectionTool }
export class QualityControlRun /* aggregate */ { readonly defects: Defect[]; passed(): boolean }
export class QualityCertificate /* aggregate */ { readonly workOrder: WorkOrderName; readonly scenarios: ScenarioResult[]; readonly verdict: Verdict }
export class ScenarioResult /* value object */ {}
export class AuditFinding /* value object */ { readonly file: string; readonly row: string; readonly verdict: "accepted" | "rejected" }
export class StageHold /* value object */ { readonly held: boolean; readonly reasons: string[] }
export class QualityException extends DomainException {}

// factory/quality/application
export interface DrawingRepositoryInterface {}
export interface InspectionRepositoryInterface { inspect(line: LineName, scope: InspectionScope): Promise<Defect[]> }   // fallow, oxlint, archunit behind adapters
export interface GaugeRunRepositoryInterface {}           // vitest and the end-to-end tool behind adapters
export interface AuditRepositoryInterface {}              // the decision model behind an adapter
export interface ReleasedWorkOrderRepositoryInterface {}  // production, through the entry
export interface LineProcessRepositoryInterface {}        // engineering, through the entry
export class MakeGaugesUseCase {}         // factory generate
export class RunQualityControlUseCase {}  // factory check
export class RunGaugesUseCase {}          // factory test
export class HoldStageUseCase {}          // hook gate            · drawing quality/hold-stage
export class InspectWorkOrderUseCase {}   // factory verify       · drawing quality/inspect-work-order
export class AuditUseCase {}              // factory review       · drawing quality/audit
```

**Tests**

- The gauges of `quality/inspect-work-order`, `quality/audit` and `quality/hold-stage` in `test/acceptance/quality/`, with the fixtures of `flow/verify`, `architecture/review` and `package/completion-gate` moved beside them.
- The unit tests of the audit's funnel and rubric, of a quality control run and of a certificate's verdict, from `review-funnel.test.ts`, `review-rubric.test.ts`, `review-record.test.ts`, `generate.test.ts` and `e2e.test.ts`.
- The integration tests of the inspection, gauge-run and audit repositories over in-memory adapters typed by their ACLs, which take the place of `review-client.test.ts`.

- [x] app-domain: model drawings, gauges, defects, quality control runs, certificates, audits and stage holds from their scaffolds, and the use cases above, with the fixtures moved to `test/acceptance/quality/`
- [x] infrastructure: the inspection tools, the test runners and the decision model behind `acl/` and `repository-implementations/`, with their integration tests
- [x] adapters: fallow, oxlint, archunit, vitest, the end-to-end tool and the decision model's HTTP API as resource adapters
- [x] modules: compose `quality` in `factory/quality.ts`, handing it production's released work orders and engineering's line process; register `generate`, `check`, `test`, `gate`, `verify` and `review` in `main.ts` with the same output as today
- [x] modules: verify the phase: `pnpm exec factory check --module quality`, `pnpm exec vitest run test/acceptance/production test/acceptance/quality`, `pnpm exec factory test unit`, `pnpm exec factory test integration`

### Phase 4: Change control and maintenance

**Seams**

```ts
// factory/change-control/domain
export class WriteRequest /* value object */ { readonly files: string[] }
export class ProtectedArea /* value object */ { readonly name: string; readonly patterns: string[] }   // gauges, current drawings, installed processes, closed work orders, controls, work instructions, the command
export class Authorization /* value object */ { readonly allowed: boolean; readonly blockedBy?: ProtectedArea }
export class ChangeControlException extends DomainException {}
// factory/change-control/application
export interface ReleasedWorkOrderRepositoryInterface {}   // production, through the entry
export class AuthorizeWriteUseCase {}                      // hook guard · drawing change-control/authorize-write

// factory/maintenance/domain
export class Equipment /* aggregate */ { readonly name: string; readonly version: string; readonly processes: ProcessName[]; readonly workInstructions: string[]; readonly controls: string[] }
export class MaintenanceItem /* value object */ { readonly kind: "missing" | "drift" | "note" | "suspect"; readonly requirement: string; readonly detail: string }
export class MaintenanceReport /* aggregate */ { readonly items: MaintenanceItem[] }
// factory/maintenance/application
export interface EquipmentRepositoryInterface {}
export class MaintainEquipmentUseCase {}           // factory doctor [--fix] · drawing maintenance/maintain-equipment
export class FindSuspectProceduresUseCase {}
```

**Tests**

- The gauges of `change-control/authorize-write` and `maintenance/maintain-equipment` in `test/acceptance/change-control/` and `test/acceptance/maintenance/`, with the fixtures of `package/write-guard` and `package/setup` moved beside them.
- The unit tests of an authorization, a maintenance report and the pinned version, from `guard.test.ts`, `suspects.test.ts` and `doctor.test.ts`.

- [x] app-domain: model change control and maintenance from their scaffolds, and the use cases above, with the fixtures moved to their acceptance folders
- [x] infrastructure: the equipment and the plant's files behind `acl/` and `repository-implementations/`, with their integration tests
- [x] adapters: pnpm, the agent package manager and the agents' folders as resource adapters
- [x] modules: compose both in `factory/change-control.ts` and `factory/maintenance.ts`; register `guard` and `doctor` in `main.ts` with the same output as today
- [x] modules: verify the phase: `pnpm exec factory check --module change-control`, `pnpm exec factory check --module maintenance`, `pnpm exec factory test acceptance`

### Phase 5: The old folders are gone and the line passes whole

**Tests**

- `pnpm exec factory check`, with no module: every standard of the line and the whole-product checks pass.
- Every gauge, unit, integration and schema test passes; `pnpm exec factory proof backend` and `pnpm exec factory proof fullstack`, run with this repository's command, prove the built packages in an empty project.

- [x] modules: remove `factory/repository`, `factory/flow`, `factory/architecture`, `factory/package`, their composition files and every `framework/` folder; point `tsconfig.json`, `vitest.config.ts`, the build's entries and `CONTRIBUTING.md` at the new layout
- [x] modules: verify the phase: `pnpm exec factory check`, `pnpm exec factory test acceptance`, `pnpm exec factory test unit`, `pnpm exec factory test integration`, `pnpm run test`, `node factory/main.ts proof backend`, `node factory/main.ts proof fullstack`

## Feedback

- **the implement phase**: OpenSpec 2.0.0 rejects retiring the nine old drawings because its retirement audit reports the Scenario Outline example tables as unaccounted content. In an isolated copy, manually retiring exactly the nine listed baselines while retaining their REMOVED deltas allowed all 59 requirements to merge and the frozen factory implement to generate all nine gauges. The frozen verify still maps factory/quality/audit to test/acceptance/factory/quality/audit.feature.test.ts, whereas generate writes test/acceptance/quality/audit.feature.test.ts. It also expects tests for removal-only deltas. The frozen revisor must be able to match the real gauges before this change can be verified.
- **the implement phase**: The verifier fix and native TypeScript import checks are verified, archived and included in the frozen checker. Carry the new verification scenarios to its renamed drawing. Before generation, retire the nine old baseline drawings by hand because the OpenSpec retirement audit rejects the example tables. Keep the removal deltas and confirm every old requirement is named by them before relocating the files.

- Phase 1 passed the frozen checks for shared and engineering, eight unit tests, three integration tests and 158 repository schema and installer tests. The schemas and prepare command outputs matched the previous command in local comparisons.

- The frozen production check passed. All 56 production gauges, the 164 tests in the production and legacy-flow selection, and the unit and integration roots passed. The phase uses the completed department’s acceptance path because the future departments’ gauges are generated already. The global acceptance run remains in the final phase. The legacy fixtures still preserve resource-level proof while the callers are migrated.

- The frozen Quality check and live generation freshness check passed. The completed departments pass 128 acceptance scenarios, and the unit and integration roots pass 37 and 17 tests. Audit protocol, record and source-outline coverage replaced the removed legacy review fixtures. An isolated local comparison preserved final inspection output and certificate bytes.

- Change Control and Maintenance passed both frozen module checks and all 197 acceptance scenarios. The new guard gauges, unit tests and real CLI hook integration replace the old write-guard fixtures. All 40 old setup scenarios passed through the new doctor before retirement. Its gauges, units and filesystem integration retain wiring, repair, package pin, managed section and runbook coverage.

- The production gauges for closing, andon pulls, dispatch and reading copies replace the corresponding legacy flow gauges. The closing and stage-start integration tests keep the old hand-written proof against disk and the CLI: OpenSpec archive and runbook metadata, readiness, generated tests, write authorization and builder-only gate release.
- The final inspection and stage-hold gauges and repository integration replace the old verify and completion-gate fixtures. The moved sample parsing, generation, preparation, products, schema YAML and work-center topology tests retain their assertions under `test/schemas`. The generation test now uses the standing modules drawing to prove that a ready delta adds its scenario and an unready delta adds none.

- The frozen and repository commands passed the whole-product checks. The acceptance, unit and integration roots passed 197, 60 and 36 tests respectively. The full Vitest suite, TypeScript check and live generation freshness check passed. Both `proof backend` and `proof fullstack` built their packages and passed the installed command's checks and tests in empty projects. The CLI help, schema listing and SDK export names matched the previous command.

## Next step
