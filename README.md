# openspec-schemas

OpenSpec schemas, the resources they are built from, and the packages built from them. A schema is a definition (`schemas/`), a package is a manifest (`packages/`), and `factory build` turns a manifest into the folder a project installs.

The first schema is `clean-backend`: Clean Architecture for a backend, with delta specs per use case and one plan that carries the decisions, the procedures and the tasks. The first package, `backend`, carries it for Claude and Codex.

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

The project needs Node 22.18 or later, pnpm, and the agent package manager APM 0.35.1 (`apm-cli`).

1. Install the package for the agents that will work in the project, from the project's root:

   ```bash
   apm install <path to this repository>/dist/backend --target claude,codex
   ```

2. Pin the command the skills call. The tarball came with the `setup` skill; its file name carries the version:

   ```bash
   pnpm add -D ./.claude/skills/setup/assets/factory-0.1.2.tgz
   ```

3. Let setup repair what the package owns and list what the project must supply:

   ```bash
   pnpm exec factory doctor --fix
   ```

   It links the package's schemas under `openspec/schemas`, sets the default schema when the project has none, creates `openspec/specs`, `openspec/adr` and `openspec/runbooks`, and writes the flow instruction into `AGENTS.md` as one marked section, keeping every line the project wrote there. It reports as `missing` what only the project can add: its test runner (`vitest`) and its type checker (`typescript`).

   `apm compile` is not needed for the flow instruction. Setup also switches the project's `apm.yml` to a managed section between the same markers, so a later `apm compile` rewrites that section and nothing else.

4. Ask the agent for a phase. In Claude Code, `/plan <what you want to change>`; in Codex, `$plan <what you want to change>`. Every phase starts by running `pnpm exec factory doctor` and follows the `setup` skill when it reports anything, so steps 2 and 3 are also what the agent does on its own the first time.

### The flow

A change goes through five skills, each calling the command:

| Skill | What it does | Command behind it |
| --- | --- | --- |
| `plan` | Opens a change and writes its plan and delta specs until they are ready | `factory validate <change>` |
| `implement` | Starts the next phase of a ready change and builds it, one workstream at a time | `factory implement <change>`, `factory check --workstream <workstream>` |
| `verify` | Runs every check and test and writes the evidence | `factory verify <change>` |
| `archive` | Consolidates the change's specs, decisions and procedures and archives it | `factory archive [change]` |
| `feedback` | Takes a correction back into the change it is about | `factory feedback <change>` |

Two guards hold the flow: a write guard lets product code through only for a change `implement` has started and never lets an agent write the harness, and a completion gate holds a turn that would leave such a change failing its checks.

### Codex

Codex loads a project's hooks and its `AGENTS.md` only in a project it trusts, and runs a hook only after it was reviewed. Trust the project, then review each hook with `/hooks`. Do it again after every update of the package that changes a hook: Codex skips a changed hook until it is reviewed.

## Work on this repository

```bash
pnpm run check
```

It type-checks, verifies that the generated tests are as fresh as the specs they come from, and runs the tests. The repository's own commands are `pnpm exec factory <command>`; `pnpm exec factory` with no command lists them.
