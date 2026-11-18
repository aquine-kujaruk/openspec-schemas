# Contributing

This repository holds the OpenSpec schemas, the resources they are built from and the packages built from them. `factory build` turns a package's manifest into the folder a project installs, and `factory release` publishes every package at the repository's version.

## Layout

```
schemas/
  spec-plan/       a plan and delta specs, with no architecture: templates, validator, question policy
  clean-backend/   extends spec-plan: Clean Architecture for a backend, the clean core with no framework
  clean-react/     extends spec-plan: a React frontend, the clean core plus react-ui and react-hooks, and its rubric
  shared/          what every package carries: the phase skills, setup, the flow instruction, the guards
    cores/         the cores schemas build through, each with its workstreams and its rubric
packages/          one manifest per package: the schemas it carries, the agents, the pinned tools
factory/           the command and its engine
  main.ts          composes the CLI host and the modules' commands
  <module>.ts      composes the module's resource capabilities, use cases and commands
  engineering/     plant, lines, processes and work centers
  production/      work orders, stage starts, handoffs, andon pulls and closing
  quality/         standards, gauges, audits, final inspection and stage holds
  change-control/  authorization for agent writes
  maintenance/     equipment, installation and runbook checks
  shared/          configuration and resources used by the departments
  sdk.ts           public contract used by schemas and packages
  # Each department keeps its domain model, use cases and resource implementations in:
    domain/
    application/   use cases and repository interfaces
    infrastructure/
      adapters/    filesystem, processes, environment and network resources
      acl/         translations between resources and the domain
      repository-implementations/
test/
  acceptance/      generated scenarios and in-memory repositories by department
  unit/            domain and application tests
  integration/     repository implementation tests
  schemas/         this repository's schema and SDK tests
tools/             build, release, proof and expect; never shipped in a package
openspec/          this repository's own specs and changes
```

A department's use cases declare the repository interfaces they need. The entry files wire those interfaces to the resources or other departments that provide them. `factory check` enforces the clean-backend layout and department boundaries from `factory.config.ts`.

Open a schema's folder and you see what only that schema is made of. A schema that builds product code names one core, a folder of `schemas/shared/cores/` that holds the workstreams of an architecture and says which waits for which, and adds the workstreams of its framework, if it has one. `clean-core` is Clean Architecture: `app-domain`, `infrastructure`, `adapters` and `modules` (the rules across modules and the entry). Its workstreams stay decoupled: no workstream owns the checks that need the whole product joined (no file left unused, duplication under 4 %); `factory check` and the verify phase run them, and verify sends each failure back to the workstream that owns the file. A schema's name is its core's short name and what it adds: `clean-backend`, `clean-react`. A resource lives with the definition that names it; one that extends another finds its base's resources in the base's folder; a resource named by two unrelated definitions lives in `schemas/shared/`. The build fails, naming the resource and where it belongs, when one is held anywhere else.

`spec-plan` is for a change no architecture covers: a procedure, a decision, tooling, documents. `clean-backend` builds a backend through the clean core. `clean-react` builds a React frontend through the same core and adds two workstreams: `react-ui` (pages, components, bridges and the entry `src/main.tsx`, built against a stub controller per page) and `react-hooks` (controllers, queries, mutations, view-models and stores; each query or mutation composes its use case over its repository and adapter once). Its rubric adds rows S01–S04, S21 and S22 to the core's.

Three packages carry them, for Claude and Codex: `backend` (`clean-backend`, `spec-plan`), `frontend` (`clean-react`, `spec-plan`) and `fullstack` (`clean-backend`, `clean-react`, `spec-plan`), for a repository that declares a backend and a frontend as products. `frontend` and `fullstack` also declare the skills `composition-patterns` and `web-design-guidelines` of `vercel-labs/agent-skills` at a pinned commit; installing them reaches GitHub.

Why each thing is the way it is lives in `openspec/`: the specs under `openspec/specs`, the change in progress under `openspec/changes`.

Open a schema's folder and you see what only that schema is made of. A schema that builds product code names one core, a folder of `schemas/shared/cores/` that holds the workstreams of an architecture and says which waits for which, and adds the workstreams of its framework, if it has one. `clean-core` is Clean Architecture: `app-domain`, `infrastructure`, `adapters` and `modules` (the rules across modules and the entry). Its workstreams stay decoupled: no workstream owns the checks that need the whole product joined (no file left unused, duplication under 4 %); `factory check` and the verify phase run them, and verify sends each failure back to the workstream that owns the file. A schema's name is its core's short name and what it adds: `clean-backend`, `clean-react`. A resource lives with the definition that names it; one that extends another finds its base's resources in the base's folder; a resource named by two unrelated definitions lives in `schemas/shared/`. The build fails, naming the resource and where it belongs, when one is held anywhere else.

`spec-plan` is for a change no architecture covers: a procedure, a decision, tooling, documents. `clean-backend` builds a backend through the clean core. `clean-react` builds a React frontend through the same core and adds two workstreams: `react-ui` (pages, components, bridges and the entry `src/main.tsx`, built against a stub controller per page) and `react-hooks` (controllers, queries, mutations, view-models and stores; each query or mutation composes its use case over its repository and adapter once). Its rubric adds rows S01–S04, S21 and S22 to the core's.

Three packages carry them, for Claude and Codex: `backend` (`clean-backend`, `spec-plan`), `frontend` (`clean-react`, `spec-plan`) and `fullstack` (`clean-backend`, `clean-react`, `spec-plan`), for a repository that declares a backend and a frontend as products. `frontend` and `fullstack` also declare the skills `composition-patterns` and `web-design-guidelines` of `vercel-labs/agent-skills` at a pinned commit; installing them reaches GitHub.

Why each thing is the way it is lives in `openspec/`: the specs under `openspec/specs`, the change in progress under `openspec/changes`.

Why each thing is the way it is lives in `openspec/`: the specs under `openspec/specs`, the decisions under `openspec/adr`, the changes under `openspec/changes`.

## Build a package

```bash
pnpm install
```

```bash
pnpm exec factory build backend
```

The package lands in `dist/backend`. `pnpm exec factory build backend --check` says whether what is there is still what a build would give, and names every resource that changed.

## Release

A release publishes the three packages together on the branch `packages`, one folder each, tagged `packages-v<version>`; a project installs from that tag. A released version is never rewritten.

1. Raise `version` in `package.json` in the change that alters what the packages carry, and merge it into `main`.
2. Tag it and push the tag: `git tag v<version> && git push origin v<version>`. The workflow `.github/workflows/release.yml` checks the tag against `package.json`, runs `pnpm run check` and `pnpm exec factory release --push origin`.

By hand, with the same result: `pnpm exec factory release --push origin`. Without `--push` it only commits and tags the release locally.

## Work on this repository

```bash
pnpm run check
```

It type-checks, verifies that the generated tests and the schemas under `openspec/schemas` are as fresh as what they come from, and runs the tests. The tests run as one project per holder of workstreams (every core, and every schema with workstreams of its own), each with that holder's defaults (`FACTORY_HOLDER`), so a layer's examples are verified with the defaults of whoever holds its workstream; every other test runs once. `pnpm exec factory generate` writes both; run it once after cloning, since `openspec/schemas` is not in git and the specification tool reads this repository's schemas from there. The repository's own changes are opened with `spec-plan`.

To exercise one semantic rule, put a counterexample and a matching reference under the row in the layer's `.examples.md`. Declare `yes` or `no` in each case's `expect` block. Select the model in `review.model`. For example, `pnpm exec factory expect domain --case S17/wrapper-id --changed` refreshes `domain.scores.json` for that case, reusing the latest matching measurement for the selected model, question and files. Switching models uses the same acceptance declarations. Run `pnpm exec vitest run schemas/shared/cores/clean-core/workstreams/app-domain/domain.feature.test.ts` to replay that layer offline. The report shows confidence in the expected answer (p for yes, 1−p for no). It passes at 95% or higher, passes with a warning from 90% to below 95%, and fails below 90%. A shift of at least 20 points from the mean of all earlier scores adds a separate warning.

A change of this repository goes through the same commands as a change of a project: `factory validate`, `factory implement`, `factory verify` and `factory archive`. While a change is ready, the tests of its delta specs are generated straight from the change, each next to the step adapter of its spec; no delta is copied into `openspec/specs` by hand, the archive merges it. For a repository spec without a generated adapter, `factory verify` runs its checked-in `test/schemas/<spec>.test.ts` when present. The suite names each requirement and each concrete scenario compiled from the delta. A missing, skipped or failed example prevents verification. `architecture/linting` uses this route. For `implementer`, `flow/plan` and `flow/implement`, which have neither suite nor adapter, say the spec is proved with `factory verify <change> --proved <spec>`, and the evidence records it as proved by your word. The repository's own commands are `pnpm exec factory <command>`; `pnpm exec factory` with no command lists them.
