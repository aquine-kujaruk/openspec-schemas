# openspec-schemas

OpenSpec schemas, the resources they are built from, and the packages built from them. `factory build` turns a package's manifest into the folder a project installs.

```
schemas/
  spec-plan/       a plan and delta specs, with no architecture: templates, validator, question policy
  clean-backend/   extends spec-plan: Clean Architecture for a backend, its workstreams and its rubric
  shared/          what every package carries: the phase skills, setup, the flow instruction, the guards
packages/          one manifest per package: the schemas it carries, the agents, the pinned tools
toolkit/           the command, `factory`
openspec/          this repository's own specs and changes
```

Open a schema's folder and you see what only that schema is made of. A resource lives with the definition that names it; one that extends another finds its base's resources in the base's folder; a resource named by two unrelated definitions lives in `schemas/shared/`. The build fails, naming the resource and where it belongs, when one is held anywhere else.

`spec-plan` is for a change no architecture covers: a procedure, a decision, tooling, documents. `clean-backend` adds the workstreams a backend is built through. The package `backend` carries both for Claude and Codex.

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
   pnpm add -D ./.claude/skills/setup/assets/factory-0.2.0.tgz
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

Two guards hold the flow: a write guard lets product code through only for a started change whose schema builds product code and never lets an agent write the harness, and a completion gate holds a turn that would leave a started change failing the checks of its own schema.

### Codex

Codex loads a project's hooks and its `AGENTS.md` only in a project it trusts, and runs a hook only after it was reviewed. Trust the project, then review each hook with `/hooks`. Do it again after every update of the package that changes a hook: Codex skips a changed hook until it is reviewed.

## Work on this repository

```bash
pnpm run check
```

It type-checks, verifies that the generated tests and the schemas under `openspec/schemas` are as fresh as what they come from, and runs the tests. `pnpm exec factory generate` writes both; run it once after cloning, since `openspec/schemas` is not in git and the specification tool reads this repository's schemas from there. The repository's own changes are opened with `spec-plan`. The repository's own commands are `pnpm exec factory <command>`; `pnpm exec factory` with no command lists them.
