# Install by hand

The [installer](../install.sh) does these steps for you. By hand, from the project's root, with APM 0.35.1 installed (`curl -sSL https://aka.ms/apm-unix | sh -s -- @v0.35.1`):

1. Install the package for the agents that will work in the project, at a release (`packages-v<version>`):

   ```bash
   apm install aquine-kujaruk/openspec-schemas/backend#packages-v0.13.1 --target claude,codex
   ```

   Installing reaches the repositories of the package's tools: the skills that ship inside a tool are declared in the package at the tool's pinned version, and APM fetches them.

2. Pin the command the skills call. It came with the `setup` skill, in the folder of the agent it was installed for (`.claude/skills` or `.agents/skills`); its file name carries the version:

   ```bash
   pnpm add -D ./.claude/skills/setup/assets/factory-0.13.1.tgz
   ```

3. Let setup repair what the package owns and list what the project must supply:

   ```bash
   pnpm exec factory doctor --fix
   ```

It links the package's schemas under `openspec/schemas`, sets the default schema when the project has none, creates `openspec/specs`, `openspec/adr` and `openspec/runbooks`, and writes the flow instruction into `AGENTS.md` as one marked section, keeping every line the project wrote there. It reports as `missing` what only the project can add: its test runner (`vitest`) and its type checker (`typescript`). It adds a `note` for each key a runbook lists under `@keys` that neither the environment nor `.env` holds; only the person can add it, and the phase goes on. It prints as `suspect` each runbook that runs a package script, a binary of `node_modules/.bin` or a file of the repository that the project no longer has; the phase goes on, and the plan phase investigates it: it updates or removes the runbook in the change it plans when that change made it stale, opens a change of its own for it when the evidence is conclusive, and otherwise tells the person.

`apm compile` is not needed for the flow instruction. Setup also switches the project's `apm.yml` to a managed section between the same markers, so a later `apm compile` rewrites that section and nothing else.

`pnpm exec factory schemas` then lists the schemas the project has and when each is used.

Steps 2 and 3 are also what the agent does on its own the first time: every phase starts by running `pnpm exec factory doctor` and follows the `setup` skill when it reports anything.

## Or hand it to an agent

Paste this to the agent, in the project's root, with the package you picked:

```text
Install the openspec-schemas package backend in this project.
1. Run: curl -fsSL https://raw.githubusercontent.com/aquine-kujaruk/openspec-schemas/main/install.sh | sh -s -- backend
2. Add what it reports as missing with pnpm, at the version it names, until pnpm exec factory doctor prints "nothing is lacking".
3. Run pnpm exec factory schemas and tell me which schemas the project now has.
Do not write product code. If the project is used with Codex, remind me that I must trust the project and review its hooks with /hooks myself.
```
