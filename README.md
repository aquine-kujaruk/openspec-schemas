# openspec-schemas

OpenSpec schemas, the resources they are built from, and the packages built from them. `factory build` turns a package's manifest into the folder a project installs.

```
schemas/
  spec-plan/       a plan and delta specs, with no architecture: templates, validator, question policy
  clean-backend/   extends spec-plan: Clean Architecture for a backend, the clean core with no framework
  clean-react/     extends spec-plan: a React frontend, the clean core plus react-ui and react-hooks, and its rubric
  shared/          what every package carries: the phase skills, setup, the flow instruction, the guards
    cores/         the cores schemas build through, each with its workstreams and its rubric
packages/          one manifest per package: the schemas it carries, the agents, the pinned tools
toolkit/           the command, `factory`: its entry and one folder per area of the specs
  core/            what every area uses: paths, types, configuration
  repository/      schemas and the build
  package/         setup, the proof and the two guards
  flow/            plan, validation, implementation, verification, archive, feedback
  architecture/    the rules, the generated tests, the checks and the review
openspec/          this repository's own specs and changes
```

Open a schema's folder and you see what only that schema is made of. A schema that builds product code names one core, a folder of `schemas/shared/cores/` that holds the workstreams of an architecture and says which waits for which, and adds the workstreams of its framework, if it has one. `clean-core` is Clean Architecture: `app-domain`, `infrastructure`, `adapters`, `modules` (the rules across modules and the entry) and `integrate`. A schema's name is its core's short name and what it adds: `clean-backend`, `clean-react`. A resource lives with the definition that names it; one that extends another finds its base's resources in the base's folder; a resource named by two unrelated definitions lives in `schemas/shared/`. The build fails, naming the resource and where it belongs, when one is held anywhere else.

`spec-plan` is for a change no architecture covers: a procedure, a decision, tooling, documents. `clean-backend` builds a backend through the clean core. `clean-react` builds a React frontend through the same core and adds two workstreams: `react-ui` (pages, components, bridges and the entry `src/main.tsx`, built against a stub controller per page) and `react-hooks` (controllers, queries, mutations, view-models and stores; each query or mutation composes its use case over its repository and adapter once). Its rubric adds rows S01–S04, S21 and S22 to the core's.

Three packages carry them, for Claude and Codex: `backend` (`clean-backend`, `spec-plan`), `frontend` (`clean-react`, `spec-plan`) and `fullstack` (`clean-backend`, `clean-react`, `spec-plan`), for a repository that declares a backend and a frontend as products. `frontend` and `fullstack` also declare the skills `composition-patterns` and `web-design-guidelines` of `vercel-labs/agent-skills` at a pinned commit; installing them reaches GitHub.

Why each thing is the way it is lives in `openspec/`: the specs under `openspec/specs`, the change in progress under `openspec/changes`.

## Build a package

```bash
pnpm install
```

```bash
pnpm exec factory build backend
```

The package lands in `dist/backend`. `pnpm exec factory build backend --check` says whether what is there is still what a build would give, and names every resource that changed.

## Install it in a project

The project needs Node 22.18 or later, pnpm, and the agent package manager APM 0.35.1 (`apm-cli`). Installing reaches the repositories of the package's tools: the skills that ship inside a tool are not copied into the package, they are declared in it at the tool's pinned version and the agent package manager fetches them.

1. Install the package for the agents that will work in the project, from the project's root:

   ```bash
   apm install <path to this repository>/dist/backend --target claude,codex
   ```

2. Pin the command the skills call. The tarball came with the `setup` skill; its file name carries the version:

   ```bash
   pnpm add -D ./.claude/skills/setup/assets/factory-0.5.0.tgz
   ```

3. Let setup repair what the package owns and list what the project must supply:

   ```bash
   pnpm exec factory doctor --fix
   ```

   It links the package's schemas under `openspec/schemas`, sets the default schema when the project has none, creates `openspec/specs`, `openspec/adr` and `openspec/runbooks`, and writes the flow instruction into `AGENTS.md` as one marked section, keeping every line the project wrote there. It reports as `missing` what only the project can add: its test runner (`vitest`) and its type checker (`typescript`).

   `apm compile` is not needed for the flow instruction. Setup also switches the project's `apm.yml` to a managed section between the same markers, so a later `apm compile` rewrites that section and nothing else.

   `pnpm exec factory schemas` then lists the schemas the project has and when each is used.

4. Ask the agent for a phase. In Claude Code, `/plan <what you want to change>`; in Codex, `$plan <what you want to change>`. Every phase starts by running `pnpm exec factory doctor` and follows the `setup` skill when it reports anything, so steps 2 and 3 are also what the agent does on its own the first time.

### Or hand it to an agent

Paste this to the agent, in the project's root, with the path filled in:

```text
Set this project up with the package at <path to this repository>/dist/backend.
1. Run: apm install <that path> --target claude,codex
2. Pin the command: pnpm add -D ./.claude/skills/setup/assets/factory-<version>.tgz, with the version the file name carries.
3. Run pnpm exec factory doctor --fix, then pnpm exec factory doctor, until it prints "nothing is lacking". Add what it reports as missing with pnpm, at the version it names.
4. Run pnpm exec factory schemas and tell me which schemas the project now has.
Do not write product code. If the project is used with Codex, remind me that I must trust the project and review its hooks with /hooks myself.
```

### The flow

A change goes through five skills, each calling the command:

| Skill | What it does | Command behind it |
| --- | --- | --- |
| `plan` | Picks the schema the intention calls for, opens a change with it and writes its plan and delta specs until they are ready | `factory schemas`, `factory validate <change>` |
| `implement` | Starts the next phase of a ready change and builds it, one workstream at a time | `factory implement <change>`, `factory check --workstream <workstream>` |
| `verify` | Runs every check and test and writes the evidence | `factory verify <change>` |
| `archive` | Consolidates the change's specs, decisions and procedures and archives it | `factory archive [change]` |
| `feedback` | Takes a correction back into the change it is about | `factory feedback <change>` |

The implement phase starts every short, rule-fixed file (schemas, entities, value objects, exception families, repository interfaces, ACLs, in-memory repositories and the shared bases) from a scaffold kept in the `## scaffolds` section of its layer's examples, rendered with `pnpm dlx ejs@7.0.2`; the first render on a machine needs the network.

Two guards hold the flow: a write guard lets product code through only for a started change whose schema builds product code and never lets an agent write the harness, and a completion gate holds a turn that would leave a started change failing the checks of its own schema.

### Several products in one repository

A repository can hold several products, each in its own folder and governed by one schema. Declare them in `factory.config.ts`:

```ts
export default {
  products: {
    api: { root: "apps/api", schema: "clean-backend" },
    worker: { root: "apps/worker", schema: "clean-backend", modules: "lib/*" },
    contracts: { root: "packages/contracts", schema: "spec-plan" },
  },
};
```

- A product's settings come from its schema's defaults, then the top level of `factory.config.ts`, then its own entry. Its roots (`modules`, `acceptance`, `integration`, `entry`) are read inside its folder.
- Its specs live at `openspec/specs/<product>/<module>/<use-case>/spec.md`, and the decisions its changes consolidate at `openspec/adr/<product>/`. There is one `openspec/` at the repository root.
- Every change builds one product, named as `x-product` in its `.openspec.yaml`, and is made with that product's schema. The changes of one intention name each other under `x-linked`. `factory validate` checks both.
- The write guard opens a product's folder only to a change of that product. The gate, `factory verify` and `factory implement` judge a change by its own product alone.
- `check`, `generate`, `test`, `prepare` and `review` run once per product, or for one with `--product <name>`. `factory schemas` lists the products.

A project with no `products` has one product at its root and works as before. A project that installs `fullstack` has two schemas that build product code, so it declares its products, or names the one schema it uses as `schema`:

```ts
export default {
  products: {
    api: { root: "apps/api", schema: "clean-backend" },
    web: { root: "apps/web", schema: "clean-react" },
  },
};
```

### From 0.3 to 0.4

The workstream `clean-architecture` is now called `modules`; it owns the same rules and the entry. A plan written before 0.4 whose tasks name `clean-architecture` is reported not ready: rename those tasks to `modules`. A project's `factory.config.ts` that sets a topology under `workstreams` renames the key the same way. A configuration can now name its platform, `platform: "web"` or `platform: "node"`.

### Codex

Codex loads a project's hooks and its `AGENTS.md` only in a project it trusts, and runs a hook only after it was reviewed. Trust the project, then review each hook with `/hooks`. Do it again after every update of the package that changes a hook: Codex skips a changed hook until it is reviewed.

## Work on this repository

```bash
pnpm run check
```

It type-checks, verifies that the generated tests and the schemas under `openspec/schemas` are as fresh as what they come from, and runs the tests. The tests run as one project per holder of workstreams (every core, and every schema with workstreams of its own), each with that holder's defaults (`FACTORY_HOLDER`), so a layer's examples are verified with the defaults of whoever holds its workstream; every other test runs once. `pnpm exec factory generate` writes both; run it once after cloning, since `openspec/schemas` is not in git and the specification tool reads this repository's schemas from there. The repository's own changes are opened with `spec-plan`.

A change of this repository goes through the same commands as a change of a project: `factory validate`, `factory implement`, `factory verify` and `factory archive`. While a change is ready, the tests of its delta specs are generated straight from the change, each next to the step adapter of its spec; no delta is copied into `openspec/specs` by hand, the archive merges it. Four specs have no step adapter and so no generated test (`implementer`, `architecture/linting`, `flow/plan`, `flow/implement`): when a change touches one, say it is proved with `factory verify <change> --proved <spec>`, and the evidence records it as proved by your word. The repository's own commands are `pnpm exec factory <command>`; `pnpm exec factory` with no command lists them.
