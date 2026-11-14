# Schemas as slices

## Why

The repository holds its resources by kind: nine folders at the root (`workstreams`, `validators`, `questions`, `templates`, `phases`, `skills`, `hooks`, `instructions`, `review`) and no way to see, by opening one folder, what a schema is made of. More schemas are coming, a project will have several at once, and the schema of a change should follow from the intention. Today the command assumes one schema per project in most places, the plan phase never chooses one, and this repository cannot plan its own work with the schema it builds, because that schema makes every task name a Clean Architecture workstream.

## What Changes

- **BREAKING** (for this repository's layout only) Resources move under `schemas/`: one folder per schema holding what only that schema uses, and `schemas/shared/` holding what several schemas use and the flow every package carries. The root keeps `schemas`, `packages`, `toolkit` and `openspec`.
- A rule decides where a resource lives, and a check holds it: named by one schema, it lives in that schema's folder; named by two or more, in `shared`.
- A new base schema, `spec-plan`: the plan and the delta specs with no workstreams. `clean-backend` becomes that base plus its workstreams and its defaults. Every package carries the base, so a change that builds no architecture (a runbook, a decision, tooling) has a schema that fits.
- The command judges each change by the schema it was made with, everywhere: readiness, starting, the gate, the write guard, verification, archiving.
- Product code opens only to a change whose schema builds it: a started `spec-plan` change does not unlock `src`.
- The plan phase reads the schemas the project has, picks the one the intention calls for, and opens one change per schema when an intention needs several.
- This repository plans its own changes with `spec-plan`.
- The README gains an instruction a person pastes to an agent to set a project up, next to the commands it runs.

Not in this change: a second architecture schema (`frontend-react`), `legacy-to-specs`, several products in one repository (one schema per folder of a monorepo), and packages installed side by side as plugins.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `repository/build`: a definition's resources are found in its own folder or in the shared one; a resource's place follows from how many schemas name it; freshness names the new paths.
- `flow/plan-validation`: a task names a workstream only when the change's schema has workstreams.
- `flow/plan`: the plan phase opens each change with the schema its intention calls for, among those the project has.
- `package/write-guard`: product code opens only to a change whose schema builds it.
- `package/completion-gate`: a change is judged by the checks of its own schema.
- `implementer`: the paths its requirements name follow the new layout (a workstream's folder, a schema's definition).
- `architecture/linting`: the path of a layer's examples follows the new layout.

## Impact

- Every resource path in the repository, and the code that resolves them (`toolkit/schema.ts`, `toolkit/build.ts`, `toolkit/paths.ts`, the review, the vitest and factory configuration). Generated tests move with their step adapters.
- `toolkit/project.ts`, `gate.ts`, `verify.ts`, `guard.ts`, `implement.ts`: the change's schema instead of the project's.
- The `plan` skill and the flow instruction. The `implement` skill, for a schema with no workstreams.
- `packages/backend.ts` lists two schemas. The package version is raised.
- Projects that installed 0.1.2: a later install adds the `spec-plan` schema; their changes and their `clean-backend` schema keep working.
- `openspec/config.yaml` of this repository, and how its schemas reach `openspec/schemas`.
