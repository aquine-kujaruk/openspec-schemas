# Tasks

Node tools are installed and run with pnpm only. Group 1 moves files and changes no behaviour: its tests are the ones that exist, unchanged. A task that finds a design decision false stops its group and comes back as feedback on this change.

## 1. Move the resources under `schemas/`

- [x] 1.1 Move the files to the layout of the design: `schemas/spec-plan/` (templates, `validators/standard`, `questions`), `schemas/clean-backend/` (the definition as `schema.ts`, `workstreams/`, `review/RUBRIC.md`), `schemas/shared/` (`phases`, `skills`, `instructions`, `hooks`), and the review's code into `toolkit/review/`. Use `git mv` so history follows.
- [x] 1.2 Point the code at the new places: `toolkit/schema.ts`, `toolkit/paths.ts`, `toolkit/build.ts`, `toolkit/generate.ts`, the review, `vitest.config.ts`, `tsconfig.json` and every relative import the move broke. `clean-backend` still names every resource itself in this group.
- [x] 1.3 Verify `pnpm run check` passes with no test edited beyond its imports and paths, `factory build backend` gives a package whose content differs from 0.1.2's only in the paths recorded in `build.json`, and `factory proof` exits zero.

## 2. Resources by definition, and the base schema

- [x] 2.1 Copy the deltas of `repository/build`, `implementer` and `architecture/linting` into the main specs, correct the Purpose line of `repository/build` and the path in the Purpose of the seven `architecture` specs, and regenerate; verify `factory generate --check` is fresh and the new scenarios fail for lack of code.
- [x] 2.2 Resolve a definition's resources in its own folder, then its bases', then `shared`, and fail naming the resource when it is in none; verify the scenarios of "A schema definition names resources that exist" pass.
- [x] 2.3 Fail the build when a resource is held where the design's rule D1 does not put it, naming the folder it belongs in; verify both outlines of "A resource is held where the definitions naming it put it" pass.
- [x] 2.4 Write `schemas/spec-plan/schema.ts` (both artifacts, validator, question policy, no workstream) and reduce `schemas/clean-backend/schema.ts` to what it adds by extending it; verify the schema file a build emits for `clean-backend` is the same as before this change, and that the freshness scenarios pass with the new paths.
- [x] 2.5 Copy the delta of `flow/plan-validation` and make the validator `standard` follow it; verify its generated scenarios pass.
- [x] 2.6 List both schemas in `packages/backend.ts`, with `clean-backend` first, and raise the version to 0.2.0; verify a build holds both schemas and each phase skill once.

## 3. The change's schema everywhere

- [x] 3.1 Compose the project's tools from its one schema with workstreams and stop, saying the project must name one, when it has two; verify a project whose default schema is `spec-plan` still checks its product with `clean-backend`'s rules.
- [x] 3.2 Copy the delta of `package/write-guard` and open product paths only to a started change whose schema has workstreams; verify its generated scenarios pass.
- [x] 3.3 Copy the delta of `package/completion-gate` and judge each change by the checks of its own schema; verify its generated scenarios pass.
- [x] 3.4 Make starting, verifying and archiving load the schema of the change they are given, and refuse by name a change made with a schema the package does not define; verify with a test per command on a `spec-plan` change.

## 4. The plan phase chooses

- [x] 4.1 Add `factory schemas`: the package's schemas in the project, each with its description; write each description so it says when to use the schema. Verify it lists `spec-plan` and `clean-backend` in a scratch project and leaves out the specification tool's own schema.
- [x] 4.2 Copy the delta of `flow/plan`; make the `plan` skill read `factory schemas`, open each change with `--schema`, open one change per schema when the intention needs several with each plan naming the other, and say which schemas exist when none covers the intention. Add the line about it to the flow instruction.
- [x] 4.3 Make the `implement` skill build a phase of a schema with no workstreams: its tasks in order, no workstream skill, no workstream check.
- [x] 4.4 Exercise it in live sessions in a scratch project with the built package, on the work profile of each agent: an intention that changes behaviour opens a `clean-backend` change; an incident to diagnose opens a `spec-plan` change; a started `spec-plan` change is refused a write under `src`. Record the transcripts in this change's `evidence/`.

## 5. This repository on its own schema

- [x] 5.1 Make `factory generate` in this repository write `openspec/schemas/<name>/` for each schema and `factory generate --check` report them stale; ignore the folder in git.
- [x] 5.2 Set `openspec/config.yaml` to `spec-plan`; verify a change opened here with it validates, starts and archives with the repository's own command, in a scratch copy.
- [x] 5.3 Rewrite the README for the new layout and add the block a person pastes to an agent to set a project up (install the built package, pin the command, `factory doctor --fix` until nothing is lacking, and what stays with the person in Codex); verify the block by giving it to an agent in an empty scratch project.
- [x] 5.4 Verify `pnpm run check` passes, `factory build backend --check` is fresh, `factory proof` exits zero and the specification tool validates every spec in strict mode.

## Workflow follow-up

- Archive this change without merging its deltas again: each is copied into the main specs by the task that builds it.
- The monorepo change: a schema says which folder it governs, the write guard and the gate follow it, specs per product. It decides the open questions on `clean-backend`'s name and on a shared Clean Architecture pack.
- `clean-frontend` and `legacy-to-specs`.
