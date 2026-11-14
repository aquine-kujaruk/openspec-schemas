# Design

## Context

Motivation is in `proposal.md`. What shapes the approach:

- The source is `arch-linter-poc/.factory` at `827d7a8`: seven workstreams, a toolkit that composes three tools (import boundaries, lint, architecture tests), an example engine, a rubric review, and four light phase skills. Every command there goes through Vite+ (`vp run factory#…`) and the project must wrap its Vite+ configuration.
- CodelyTV's `codely-spec-plan` schema (`CodelyTV/agent-harness@5bba758`) proves the two-artifact shape: `specs` plus one `plan.md` that is also the task list, with `apply` tracking `plan.md`. It has no decisions log, no runbooks, no verify and no archive behaviour of its own.
- OpenSpec lets a schema define any artifacts and lets `openspec/config.yaml` add context and rules. It does not let anyone change the text of its generated skills (its `update` rewrites them), has no lifecycle hooks, and merges deltas only for `specs/**/spec.md`. A schema inherits nothing from another schema.
- The agent package manager (APM) places skills, instructions and hooks for each agent and pins them with a lockfile. It installs no Node dependency and runs no script of a package. For Codex it places skills, agents and hooks only: no slash commands, no language server, and instructions only through `apm compile`.

Where each decision comes from is marked: **Agreed** (answered by the person on Easel, 2026-11-13), **Said** (the person's words in capture session `20261113-131022` or in chat the same day), **Assumed** (mine; not agreed, change freely).

## Goals / Non-Goals

**Goals:**

- One schema, `clean-backend`, usable end to end in an empty backend project.
- A repository laid out so that a second schema, or a variant of the first, costs a definition and not a copy.
- Every rule of the flow backed by something an agent cannot skip.

**Non-Goals:**

- The `clean-frontend` and `legacy-to-specs` schemas. They get a place in the layout and nothing else.
- Using the `fdk` library. The build here is a script; it is the slot where `fdk`'s synthesis can go later.
- Publishing to a registry, creating a remote, or committing.
- A derived index or search over the archive (`@origin` is written; nothing reads lineage yet).
- Production workstreams (delivery, environments).

## Decisions

### Agreed

**A1. Own command, tools called directly, pnpm only.** The package exposes one command, `factory`, and calls the linter, the test runner and the boundary tool itself. Vite+ is not required. Alternative: keep Vite+ as a peer requirement (copy `.factory` almost as is); rejected because the package must install in any backend. Node tools are installed and run with pnpm, never npm.

**A2. Planning detects and tags; archiving applies.** While planning, the agent reads the consolidated decisions and procedures and writes, on each durable block of the plan, what the change does to them. Archiving applies those tags and reports; it never asks. A tag that no longer holds (the block it names is missing, already exists, or was written by another change since the plan saw it) writes nothing and comes back as feedback on the same change. Alternatives: the archiver identifies the operations itself; the archive pauses on a diff. Both rejected by the person: the decision is taken in exploration and travels in the plan.

**A3. One door, then a lockfile.** A project installs a built package with the agent package manager and nothing else by hand. The first phase run calls the command through `pnpm dlx` once to pin it as a development dependency at the exact version the skills name; from then on every call is `pnpm exec factory …` under the project's lockfile. Alternative: always `pnpm dlx`; rejected because without a lockfile the transitive dependencies of each tool are resolved at download time. While the command travels as a tarball inside the built package (X7), the first run pins it straight from that path and `pnpm dlx` is not involved (V4).

**A4. Instruction and guards.** The flow rule ("every intention that changes something enters through plan or feedback") is written for each agent, and two guards back it: a write guard and a completion gate (see Guards). Source of the guard design: Claude Code session `6984b585-cd56-4dea-a77b-1f5dfa89f034`.

**A5. The review is optional.** Verify always runs the checks and the tests. The rubric review runs only when the project configures its key; otherwise it is skipped and the evidence says so. Its warnings never fail a change.

**A6. Runbooks by purpose.** Consolidated procedures live under `openspec/runbooks/<purpose>/<topic>.md`, purpose one of `setup`, `access`, `diagnose`, `operate`, with the environments as a tag. A change may be a runbook and nothing else: the plan is always there, the specs are not.

**A7. A repository of schemas, built.** A schema is a definition; a package is a manifest; `factory build <package>` emits what a project installs. A project installs one built package. Alternative: one hand-written package per schema depending on shared packages; rejected because OpenSpec schemas inherit nothing, so each variant would be a copy.

### Said

- **S1. Two artifacts.** `specs` and `plan`. Decisions and procedures are sections of the plan, not delta files of their own; they are consolidated at archive.
- **S2. Clean Architecture only.** Workstreams `app-domain`, `infrastructure`, `adapters`, `clean-architecture`, `integrate`. No React.
- **S3. Four phases over OpenSpec, plus feedback.** Plan is explore and propose; feedback is explore and update on the same change.
- **S4. No handoff after exploring.** The first proposal is written from the agent's decisions; each answer is an update. The artifacts are the handoff.
- **S5. The agent decides what it can** and asks only what it cannot.
- **S6. The plan is Codely's with fdk's seams.** Goal, decisions, phases; each phase has seams (public signatures), tests and tasks.
- **S7. Claude and Codex.** The rule goes in `CLAUDE.md` and `AGENTS.md`.
- **S8. The specification tool is pinned by the package.** A new version of it is a new version of the package.
- **S9. Validator and question policy are resources a schema picks**, so the same schema can exist with another validator or another way of asking.
- **S10. Two schemas can live in one project.** Each change records the schema it was made with.

### Assumed

- **X1. Names.** Repository `openspec-schemas`; command `factory`; schema `clean-backend`; package `backend`.
- **X2. OpenSpec 2.0.0.** No longer an assumption: verified in V1. The package pins 2.0.0.
- **X3. One phase per run.** `implement` builds the first phase with unchecked tasks and stops, as Codely's `apply` does.
- **X4. `archive` with no change named** archives every verified change, oldest first.
- **X5. Tag names** (`@adds`, `@modifies`, `@replaces`, `@renames`, `@removes`, `@applies`, `@enforced`, `@area`, `@topic`, `@purpose`, `@env`, `@base`, `@origin`), **the list of harness paths**, and **three** as the number of failed attempts before handing over.
- **X6. `factory.config.*` is harness.** An agent cannot write it in this change; the person edits it. Letting a plan's decision authorise a configuration key is left for later.
- **X7. Nothing is published.** The proof installs from a local path and a local tarball.
- **X8. Done means** (a) `factory proof` passes in an empty project, (b) one full loop on an `orders` module leaves a consolidated spec, decision and procedure, (c) one runbook-only change archives with no code.
- **X9. Baseline import** as described below, straight into `openspec/specs/`, not through deltas.
- **X10. Backend defaults of the schema.** Platform `node`: the globals `process`, `fetch`, `WebSocket`, `navigator`, `localStorage` and `sessionStorage` are the environment. Framework packages vetoed by default are the HTTP delivery ones (`express`, `fastify`, `koa`, `hono`, `@nestjs/*`), the same list for the core and for infrastructure. The entry is `src/*.ts`. A project changes any of them in `factory.config.ts`.
- **X11. The entry is a zone.** The composition root may import every zone and nothing imports it. `clean-architecture` owns it, since the source declared it in a React layer this schema does not have. No requirement names the zone; the boundaries of the other layers already say "never the entry".
- **X12. Command surface so far.** `factory check [--workstream <ws> | --layer <layer>] [--module <module>]`, `generate [--check]`, `expect [layer…]`, `prepare`, `test <acceptance|integration>`, `review`. `check` with no selector is the whole pipeline: every rule, the whole-product checks and the freshness of the generated tests. `test` runs the project's own test runner over one configured root.
- **X13. Reach of `no-harness-escapes`.** The module root and both test roots, and besides the four cases the delta names, a directive that silences the boundary tool.
- **X14. The duplication check skips the generated acceptance tests**: they repeat by design and are not product code.
- **X15. A definition is data.** It names its workstreams, its validator, its question policy and its templates; loading it fails naming the resource that does not exist. The validator of `clean-backend` is called `standard`.
- **X16. What only the schema knows travels in the schema.** The emitted instruction of the plan ends with the workstreams a task may name and with the text of the question policy, so the specification tool hands both to whoever writes the plan and the phase skills stay generic.
- **X17. `factory validate <change>`** exits 0 when the change is ready, 1 when it is not, listing every finding with its rule, and 2 when the change cannot be judged: it does not exist, or no schema of the package made it. It judges with the validator of the schema the change records.
- **X18. Checks of the `standard` validator the scenarios do not name.** A required tag needs a value; `@area` is `product` or `production`; a block that modifies or removes keeps the slug it names; the new slug of a block that replaces or renames must be free; a change with no plan is not ready. A value is shaped like a credential when it carries a provider's key prefix, is a private key or a signed token, or is a long mixed-case value assigned to a word such as `password` or `token`.
- **X20. The manifest of a package** lists its schemas, its agents, the tools the command runs each at one exact version, the skills it takes from those tools, and the language servers. The tools are the command's dependencies; a test keeps them equal to this repository's own, so what is tested is what ships. `feat2test` and `opsx-gherkin` ship the two Gherkin skills, so the build copies them from there and no second lock is kept.
- **X21. What `dist/<package>` is.** The folder the agent package manager installs from: `apm.yml`, the skills, the instruction, the wiring, and `build.json`, the record of what the package carries and of every resource it was built from. The command rides in the `setup` skill as `factory-<version>.tgz`, version the repository's. It holds the modules the command reaches, as JavaScript; one flat definition per listed schema, a variant already laid over its base; the declarations a project's `factory.config.ts` is typed with; and each schema as the specification tool reads it, under `openspec/schemas/<name>`.
- **X22. `factory build <package> [--check]`.** A build removes what was built before, so one that fails leaves nothing. `--check` builds elsewhere and compares the recorded resources: it names each one edited, added or removed, and exits 1 when there is any.
- **X23. `factory openspec <arguments>`** runs the pinned specification tool, so a phase never depends on which version a project happens to have.
- **X24. Phases, setup and instruction are seeds.** `plan`, `implement` and `setup` carry the procedure that already runs. `verify`, `archive` and `feedback` state their contract and tell the agent the procedure is not available yet; task groups 5 and 7 write them. The workstream skills and their examples are references of `implement`. Templates are not copied as references: the specification tool hands them (X16).
- **X25. What an installed package says about itself** travels in the `setup` skill, next to the command, as `assets/manifest.json`: its version and the tarball's name, its agents, schemas and phases, the text of its instructions, the wiring it deploys, the version of the agent package manager it was built against, and what a project supplies itself. Setup reads it from the first agent whose skills hold it. It is on the skills' side on purpose: after an update, the command still pinned is the old one, and it must judge against what the new skills say.
- **X26. `factory doctor [--fix]`** prints one line per thing lacking, as `missing`, `drift` or `repaired`, then `note` lines. It exits 0 when nothing is lacking, 1 when something is, 2 when no package is installed. A note never changes the exit status.
- **X27. What counts as each thing.** The command is pinned when it is a development dependency and the lockfile records the version the skills name. A schema link holds when it leads to the schema inside the installed command; a folder of the project with that name is reported and left alone. The consolidated roots are created with a placeholder file, so the repair survives a commit. A test runner and a type checker are there when the project's manifest names them. For an agent: its phase skills in its skills folder; the instruction as a rule file for Claude and as text in `AGENTS.md` for Codex; the guards only when the package ships a wiring.
- **X28. Notes.** The package was installed with another version of the agent package manager than it was built against; the agent package manager lists approvals as pending (asked only when it is on the path); the project's type checker is a major version older than the language server needs; and, once a wiring ships, Codex's trust and hook review.
- **X29. The guards as commands.** `factory guard` and `factory gate` read what the agent hands a hook on standard input; `factory guard <path…>` judges paths given by hand. Refusing is exit status 2 with the reason on standard error, in both agents; allowing prints nothing. The project is the nearest folder, from where the agent stands, that holds `openspec`.
- **X30. What the write guard calls harness**, beyond the list above: the installed command (everything under `node_modules`, because the guard's own code lives there), Claude's local settings file and Codex's project folder (either can switch the hooks off). A path outside the project is nobody's business. The product roots are the module root and both test roots.
- **X31. What the gate runs.** The harness first: generated tests against their specs, the schema links, the factory configuration against what is committed, the agents' skills against the hashes the agent package manager recorded, the wiring in each agent's hook file. An altered harness counts as a failed attempt like any other. Then the checks of the phase being built: `factory check --workstream` for the workstreams its tasks name that are upstream of no other, and the product tests those workstreams and their upstream ones are proved by (`app-domain` by acceptance, `infrastructure` by integration).
- **X32. Where a change stands with the gate** is `gate.json` in the change's folder: the failed attempts in a row, who the change waits for, and the findings of the last attempt. A pass deletes it. From the third failure on the agent finishes and the record says the change waits for the person. An agent can edit that file; the worst it gains is the hand-over it would reach anyway.
- **X33. Starting is an act.** `factory implement <change>` validates the change, prepares the roots, generates the tests of its delta specs and writes `gate.json`; that file existing is what "started" means. The pass of the agent that builds deletes it, so the next phase is started again and one run builds one phase by rule. A helper's pass only clears the count, or the agent it helps would lose the right to write. Taking feedback in deletes it too.
- **X34. Tests are generated from what the specs will be.** The consolidated specs overlaid with the delta specs of every active change that validation reports ready. The overlay is the specification tool's own merge: the command archives those changes in a throw-away copy of `openspec` and reads the result. A delta that does not merge fails generation, and with it the checks and the gate.
- **X35. Feedback has two moments.** *Raised*: a phase or a guard records it in the change's `feedback.json`, naming what it is about (a block, a workstream, a task). *Taken in*: `factory feedback <change> take --from <source> --says <text> [--phase <n>] [--ask <question>]…` adds the entry under the plan's Feedback, unchecks the tasks of phase `<n>` and of every later one, lists each question under Open questions, and settles what that source had raised. `factory feedback <change>` lists what waits; `… raise …` is how the implement phase raises its own.
- **X36. Evidence.** `factory verify <change>` writes `evidence.md` in the change: a verdict, a digest, and what was found. Each scenario is a generated acceptance test of a use case the change's delta specs name, with its result. Workstreams are checked after those they wait for, so a failure is named by the one that owns it, and one whose upstream fails is not checked. The review runs when its key is set and is otherwise recorded as skipped. A procedure tagged `local` or `sandbox` needs the outcome of its execution, handed over as `--procedure <slug>@<env>=passed|failed`; in any other environment it is recorded as reviewed only. The digest covers the plan (ticks aside), the delta specs and every file under the product roots: the archive accepts evidence only of the state it finds.
- **X37. `factory archive [change]`.** Per change, oldest first: the evidence must say verified and its digest must hold; the plan's tags must still hold, or feedback is raised naming the block; the consolidated decisions and procedures are written; the specification tool archives the change; the generated tests are written again. If the tool refuses, the consolidated files are put back as they were. The command then runs every check and says so.
- **X38. What a rename keeps.** `@renames` gives the standing block its new slug and title and a new origin, and keeps its body.
- **X39. `factory proof [package]`** builds the package, puts it in an empty project (with the agent package manager when it is on the path, by copying otherwise), pins the command from its tarball together with what a project supplies, runs setup with repair, writes out the reference module of the package's workstreams, and with the installed command generates its tests, checks its rules up to `clean-architecture` and runs its acceptance and integration tests.
- **X40. A subprocess is read through files.** Inside the sandbox Codex runs commands in, reading a subprocess through pipes fails, and the command then saw empty output from its own tools. Every tool the command runs now writes to a temporary file the command reads.
- **X41. The planner reads the workstreams.** Seams are signed in the folders and with the names each workstream's skill gives; the plan skill sends the planner to read them, because a first live plan signed seams in folders the architecture does not have.
- **X19. The tools of a project are composed from its default schema**, the one `openspec/config.yaml` names, when the package defines it; otherwise from the first schema the package defines.

### Layout

```
schemas/clean-backend.ts     definition: artifacts, workstreams, validator, question policy
workstreams/<ws>/            workstream.ts, SKILL.md, <layer>.rules.ts, <layer>.examples.md,
                             step adapter, generated tests
phases/<phase>/SKILL.md      plan, implement, verify, archive, feedback; generic, they read
                             the schema of the change they work on
skills/<skill>/              the package's own skills that are not phases: setup
instructions/<name>.md       what every agent is told in every session: the flow
hooks/<name>.json            the guard wiring; arrives with the guards
validators/<name>/           what "ready" and "verified" mean for a schema
questions/<policy>.md        which decisions reach the person
templates/                   plan.md, spec.md
toolkit/                     the factory command
review/                      rubric and decision client
packages/backend.ts          manifest: schemas, agents, pinned tool versions
dist/<package>/              build output, never edited by hand
openspec/                    this repository's own specs and changes
```

A built package holds: the manifest the agent package manager reads (targets `claude` and `codex`, the language server declaration), the five phase skills with the workstream skills, examples and templates as their references, a `setup` skill, the two Gherkin skills copied whole from the pinned tools that ship them, the flow instruction, the guard wiring, and the command as a tarball that carries each schema's `schema.yaml` and templates.

The agent package manager copies skill folders whole and nothing else (V2), so the tarball rides in the `setup` skill's assets; that skill says how to set a project up and repair it, and every phase skill starts by checking setup.

For now `schemas/clean-backend.ts` holds what the tools are composed from: the workstreams and the defaults a project overrides. Its artifacts, validator and question policy arrive with the schema itself (task group 3). The command composes each tool's configuration for one run under `node_modules/.cache/factory/` in the project; nothing generated lands in the project's tree except the tests. This repository depends on itself by a link, so `pnpm exec factory` and `import … from "factory"` behave here as in a project (V6).

Two TypeScripts are involved (V5). The project's own is the type checker and the language server. The command carries its own older one, because the current one no longer offers the compiler interface that the review uses to split a file into units.

### The schema OpenSpec sees

```yaml
name: clean-backend
artifacts:
  - id: plan
    generates: plan.md
    requires: []
  - id: specs
    generates: "specs/**/*.md"
    requires: []
apply:
  requires: [plan]
  tracks: plan.md
```

Neither artifact requires the other: the plan phase writes both as decisions are taken, and a change with no behaviour sets `skip_specs: true`. This avoids depending on how OpenSpec treats a skipped dependency (not verified). In the project, `openspec/schemas/clean-backend` is a link to the schema inside the installed command.

### The plan

```markdown
---
name, description, created_at, created_by, schema
---
# <title>
## Goal
## Decisions                 change-local, one line each, naming the discarded alternative
## Open questions            empty before the change is ready
## Architecture decisions
### Decision: <slug> · <title>
@adds @area:product @topic:money @applies:domain,infrastructure @enforced:review
<statement with SHALL>
Why · Alternatives · Consequences
## Procedures
### Procedure: <slug> · <title>
@adds @purpose:diagnose @topic:logs @env:prod
When · Requires · Steps · Verification
## Phases
### Phase 1: <vertical slice>
**Seams**   public signatures, in code
**Tests**   suites and what each covers
- [ ] <workstream>: <task>
- [ ] <workstream>: verify the phase
## Feedback                  one entry per feedback taken in
## Next step
```

- A phase is a part of the change worth having on its own (Codely). Inside a phase, tasks name one workstream each and follow the configured topology (fdk).
- Every durable block carries exactly one operation tag. `@modifies`, `@replaces`, `@renames` and `@removes` name an existing slug and carry `@base:<origin>`, the origin the plan phase saw on that block.
- Only phase tasks are checkboxes, because the specification tool counts every checkbox in the tracked file. The task that verifies a phase names a workstream like any other: validation asks every task for one.
- A procedure names where a secret is kept, never the secret.

Which artifact a decision goes to: a user notices it → `specs`; it would hold in any project → out of the change, as a proposal to this repository; a future change must respect it → architecture decision; it says how the system is run or diagnosed → procedure; otherwise → the plan's decisions.

### Consolidated

- `openspec/specs/…`: merged by the specification tool.
- `openspec/adr/<area>/<topic>.md`, area `product` or `production`: blocks `### Decision: <slug> · <title>` with `@origin`, `@applies`, `@enforced`, the statement and a short why. Alternatives and consequences stay in the archived plan.
- `openspec/runbooks/<purpose>/<topic>.md`: blocks `### Procedure: <slug> · <title>` with `@origin`, `@env`, and When, Requires, Steps, Verification.
- A slug is unique within its tree. `@origin` is the archived name of the last change that wrote the block; only the archive writes it.

### Archive order

For each change, oldest first: check the evidence; dry-run every tag against the consolidated tree; write the consolidated decisions and procedures; call the specification tool's archive (merges spec deltas and moves the folder); regenerate the tests and run the checks; report. The consolidated files are written before the folder moves so that a failure leaves the change active. `factory archive` does the writing by rule; the archive skill only calls it and relays the report.

### Guards

- **Write guard** (`factory guard`, wired to the agent's file-writing event). Refuses a write under the product roots when no change is in implementation. Refuses every write to the harness: the project's factory configuration, generated tests, installed schemas, the agents' installed skills and guard wiring, the consolidated trees, archived changes. Allows a change's own artifacts.
- **Completion gate** (`factory gate`, wired to the agent's stop event and to the helper agent's stop event). With a change in implementation: the harness must be as installed and generated, and the checks of the phase's workstreams must pass; otherwise the agent is sent back with the findings. The third refusal in a row lets the agent stop and records the change as waiting for the person.
- **Rule `no-harness-escapes`**, checked with the whole-core rules.
- The write guard judges the agent's file edits. A write made through a shell reaches the hook only as command text, so it is caught by the gate's harness check, which is why both exist.
- One write may touch several files (a Codex patch does). The guard judges each and refuses the write when it would refuse any of them.

A change is *in implementation* from the moment the implement phase starts building one of its phases (`factory implement <change>`, which starts only a ready change with an unchecked task) until the checks of that phase let the agent finish. A plan that is merely ready is nobody's to hold: when it was, the gate kept the agent that had just planned from stopping until it built the first phase (V11).

### Setup

`factory doctor` reports; `factory doctor --fix` repairs what the package owns: the pinned dependency, the schema links, the default schema when none is set, the consolidated roots, and the flow instruction's section in an instruction file the project already wrote. It never installs the project's test runner or type checker; it reports them.

The flow instruction reaches Claude as a rule file and Codex as a section of `AGENTS.md` (V2). When the project already has an `AGENTS.md`, the agent package manager will not touch it unless the file carries two markers and the project's manifest asks for a managed section. Setup with repair writes the section itself, between those same markers, and asks for the managed section in the project's manifest; it never runs the agent package manager, so setup needs no second tool, and a later `apm compile` rewrites that section and nothing else (V9).

For the agents' installed skills and guard wiring, "as installed" is what the agent package manager's lockfile records: it lists every deployed file with its hash (V2), so the completion gate compares against it.

### Baseline

Imported into `openspec/specs/` as the first work of this change, from `arch-linter-poc@827d7a8`:

| Source (`openspec/specs/factory/…`) | Target | Treatment |
| --- | --- | --- |
| `architecture/{domain,application,acceptance,infrastructure,integration,adapters,modules}` | `architecture/<layer>` | Paths and command names reworded. `no-hooks` dropped from domain, application, infrastructure and adapters (hooks are React's). "The framework" and "the delivery plugin" became the entry, and the case `imports-framework` became `imports-entry` |
| `architecture/linting` | `architecture/linting` | Reworded: the command replaces `vp run factory#…`; rows that named `no-hooks` name another rule; in a project `factory generate` generates only acceptance tests |
| `architecture/review` | `architecture/review` | Reworded; rubric rows S01–S04 (hook, store, controller, view-model) dropped; a missing key is no longer called mandatory (A5): exit status 2 lets the caller tell "did not run" from "found nothing" |
| `implementer` | `implementer` | Reworded; React rows dropped; "Prepare writes a pointer per phase and per vendored skill" not imported (superseded by `package/setup`); "The implementer's skills name every workstream" not imported (phase skills are generic and read the schema, see Layout) |
| `architecture/{ui,framework}` | not imported | React; they belong to `clean-frontend` |
| `package` | not imported | Superseded by `repository/build` and `package/setup` |

These requirements were already agreed and archived where they come from, so they are imported and not proposed again.

The rubric travels as `review/RUBRIC.md`, in English, rows S05–S20 with their ids. S06, S07, S15 and S19 lost the half that spoke of views; their layers no longer list a framework folder. The pass record is `.factory-review.json`.

## Verified

Task group 1, run on 2026-11-13 in scratch projects: Node 22.23.2, pnpm 12.16.1, Linux with glibc 2.35. The outputs were read and not kept; what follows is what they said.

### V1. OpenSpec 2.0.0 runs the two-artifact schema (task 1.1)

`@fission-ai/openspec@2.0.0`, a hand-written `clean-backend` schema reached through a link from `openspec/schemas/`, and deltas in this repository's format (Scenario Outlines, step-name comments, Examples).

| Command | Result |
| --- | --- |
| `openspec schema which clean-backend --json` | `"source": "project"`; the path is the link |
| `openspec schema validate clean-backend --json` | `"valid": true, "issues": []` |
| `openspec new change add-orders --json` | `"schema": "clean-backend"` |
| `openspec status --change add-orders --json` | `applyRequires: ["plan"]`, `plan: done`, `specs: done`, `isPlanningComplete: true` |
| `openspec instructions plan --change add-orders --json` | the schema's `instruction` and `template` verbatim, `dependencies: []` |
| `openspec instructions apply --change add-orders --json` | `state: "ready"`, 5 tasks read from `plan.md` (every checkbox), the schema's apply instruction |
| `openspec validate add-orders --strict --json` | `"valid": true` |
| `instructions apply` again, tasks ticked | `state: "all_done"` |
| `openspec archive add-orders -y --json` | `archivedAs: "2026-11-13-add-orders"`, `specsUpdated: true`, `added: 1`; the merged spec keeps the outline, the step names and the examples |
| `openspec validate diagnose-checkout --strict --json`, plan only | `"valid": false`: "Change must have at least one delta" |
| the same with `skip_specs: true` | `"valid": true`; status shows `specs: skipped`, `isPlanningComplete: true` |
| `openspec instructions apply --change diagnose-checkout --json` | `state: "blocked"`: the plan "contains no tasks to work on" |
| `openspec archive diagnose-checkout -y --json` | archived, `specsUpdated: false` |

Consequences: the package pins 2.0.0. A change with nothing to build reads as `blocked` to the specification tool's apply, so the flow decides from its own validation and never from that state.

### V2. The agent package manager (task 1.2)

`apm-cli` 0.35.1 from PyPI, cross-checked against `microsoft/apm`'s `pyproject.toml` and its release `v0.35.1`, run under Python 3.12. The prebuilt binary needs glibc 2.38; this machine has 2.35, so the Python package is the route here. A hand-made package was installed from a local path with `apm install ../pkg --target claude,codex`.

- Skills are copied whole, references and a binary asset included, to `.claude/skills/<skill>/` and `.agents/skills/<skill>/`.
- Hooks are merged into `.claude/settings.json`, keeping the keys already there and leaving valid JSON, and written to `.codex/hooks.json`.
- The instruction reaches Claude as `.claude/rules/<name>.md`, global when it has no `applyTo`; `CLAUDE.md` is never written. It reaches Codex only through `apm compile`.
- `apm compile` with a hand-written `AGENTS.md` writes nothing ("Protected AGENTS.md"). With `compilation.agents_md.mode: managed_section` in the project's `apm.yml` and the two markers in the file, the instruction goes between the markers and the rest is kept. With no `AGENTS.md`, the file is generated.
- The language server declaration is written to `.claude/skills/apm-lsp/.claude-plugin/plugin.json`. It was not loaded in a live Claude session.
- `apm.lock.yaml` lists every deployed file with a sha256.
- `apm approve --pending` lists the package's hook and language server as unapproved although both were deployed.
- `apm install --dry-run` creates `apm.yml`. APM keeps state under `~/.apm/`.

Consequences: the Setup and Layout sections above (markers and managed section, the `setup` skill carrying the tarball, the lockfile as the reference for the gate). "The rule goes in `CLAUDE.md`" (S7) holds in effect, through a rule file.

### V3. Hook events (task 1.3)

Claude Code 2.1.322, from its documentation; a live session came later and held to it (V13).

| Moment | Event | Can a hook refuse? |
| --- | --- | --- |
| Before a file write | `PreToolUse`, matcher `Edit\|Write`; the path arrives as `tool_input.file_path` | Yes: exit status 2, or `permissionDecision: "deny"`; the reason goes back to the model |
| The agent is about to finish | `Stop` | Yes: exit status 2, or `decision: "block"`; `stop_hook_active` marks a turn that is already a continuation; Claude Code ends the turn itself after 8 refusals in a row |
| A helper agent finishes | `SubagentStop` | Yes, the same control |

- Hooks in the project's settings also fire inside helper agents.
- A write made through the shell tool is not a file-tool event: `PreToolUse` sees only the command text. A `FileChanged` event exists for a file changed by anything, after the fact.
- Not confirmed in the pages read: `MultiEdit` as a tool name the matcher must list.

Codex CLI 0.166.0, from its documentation and its source at tag `rust-v0.166.0`, plus `codex features list` on this machine (`hooks  stable  true`); no session was started.

| Moment | Event | Can a hook refuse? |
| --- | --- | --- |
| Before a file write | `PreToolUse`; a file edit matches as `apply_patch`, `Edit` or `Write`, a shell command as `Bash` | Yes: exit status 2 with the reason on stderr, or `permissionDecision: "deny"`; the reason goes back to the model |
| The agent is about to finish | `Stop` | Yes: exit status 2 with the reason on stderr, or `{"decision":"block","reason":…}`; the reason becomes the next prompt; `stop_hook_active` marks a continuation; Codex sets no limit of its own |
| A helper agent finishes | `SubagentStop` | Yes, the same control |

- A file edit carries no path field: `tool_input.command` is the whole patch, and one patch may touch several files (`*** Add File:`, `*** Update File:`, `*** Delete File:`, `*** Move to:`).
- The pre-write hook fails open: a hook that crashes, times out, exits with another status, or exits 2 with nothing on stderr lets the write through. Codex's own documentation calls tool hooks "a useful guardrail, not a complete enforcement boundary".
- `Stop` expects JSON on stdout when the hook exits 0; plain text is invalid.
- A project's hooks load only when the project is trusted, and each hook definition must be reviewed once with `/hooks`; a changed definition is skipped until reviewed again. An untrusted project does not supply its `AGENTS.md` either.
- Skills are read from `.agents/skills/` and invoked with `$<name>` or `/skills`. Codex has no project slash commands. No language server configuration was found.
- The wiring the agent package manager wrote in V2 (`.codex/hooks.json`, matcher `Edit|Write`) selects Codex's file edits.

Consequences:

- Both agents fire all three events, so both guards serve both agents. The write guard reads a path from Claude and a patch from Codex, and judges every file a patch touches.
- Both agents' pre-write hooks fail open, so the completion gate's harness check is what makes the harness rule hold; the write guard only makes the refusal arrive early.
- Three failed attempts before handing over (X5) fits under Claude Code's limit of eight and is the only limit in Codex.
- In Codex the guards do nothing until the person trusts the project and reviews the hooks, and again after every package update that changes them. Setup says so; it cannot do it for the person.

### V4. pnpm (task 1.4)

- `pnpm dlx <absolute path to tarball> <args>` and `pnpm --package=<tarball> dlx factory <args>` run the command and leave the project untouched. With a relative path `dlx` fails: the tarball "does not exist".
- The stub's ranged dependency (`ms ^2.1.0`) was resolved when `dlx` ran, to 2.1.3; the project got no lockfile from it.
- `pnpm add -D ./<path>/factory-0.1.0.tgz` records `file:<relative path>` in `package.json`, and the tarball's sha512 with the resolved tree in `pnpm-lock.yaml`. `pnpm install --frozen-lockfile --offline` reproduces it and `pnpm exec factory …` runs it.
- pnpm 12 checks the lockfile against its supply-chain policies when it runs a pinned command.
- Not verified: how long `dlx` keeps what it downloaded (the setting is unset here).

Consequence: stated under A3.

### V5. Linter, type checker, language server (task 1.5)

- `oxlint@1.93.0` with `oxlint-tsgolint@7.0.2007` and `typescript@7.0.2`: `oxlint --type-aware -D typescript/no-floating-promises` reports a floating promise that plain `oxlint` does not.
- `tsc --lsp --stdio` answers `initialize` as `typescript-go 7.0.2`. So does `pnpm exec tsc --lsp --stdio`, which lets the manifest name the server without relying on `PATH`.
- `typescript@7.0.2` has no compiler interface at its main entry: `createSourceFile` and `createProgram` are undefined and only `./unstable/*` is exported. `archunit@2.5.4` depends on its own `typescript ^5.9.3`. `@typescript/typescript6` is at 6.0.2.

Consequence: the two TypeScripts described under Layout. The `backend` manifest pins the three versions above for the project side.

### V6. The port (task group 2)

Run on 2026-11-13 in this repository and in two scratch projects.

- pnpm does not put a package's own command on its path: `pnpm exec factory` failed until the repository depended on itself with `"factory": "link:."`.
- Node refuses to strip types from a file under `node_modules` (`ERR_UNSUPPORTED_NODE_MODULES_TYPE_STRIPPING`). The command runs from TypeScript here, where the link resolves outside `node_modules`; the tarball a project installs must hold JavaScript.
- The linter reads an override's `files` relative to the configuration file: a configuration written in the cache folder matched nothing until the patterns were absolute. The boundary tool reads its patterns relative to the folder it runs in, wherever `--config` points.
- The architecture-test library extends the matchers of a test runner it finds through the `VITEST` variable and throws when there is none to extend: this repository's test configuration turns `globals` on, and the command clears the variable, since a process started from a test inherits it.
- Recording the examples again after the backend adaptation (`express` for `react`, `process.cwd()` for `window.open`, `imports-entry` for `imports-framework`) changed no expectation: same files, same tools.
- `pnpm run check` passes: type check, `factory generate --check`, 241 tests in 24 files. The suite also passes with the workstreams chained in sequence in `factory.config.ts`.
- OpenSpec 2.0.0 validates the ten imported specs and this change.
- On the reference module written out as a project: `factory check --workstream clean-architecture` exits 0; an `express` import in an entity exits 1 naming the file and `[no-framework-import]`; `--module` restricts the report; `factory prepare` creates the roots once; `factory test acceptance` runs the project's runner; `factory review` without a key exits 2 naming the variable.
- On that same project `no-unused-files` reports sixteen files: a reference module has no entry, and without one nothing reaches the adapters. A real backend needs its entry before `integrate` can pass.

Consequences: the build compiles the command before packing it (task 4.1). The implement phase creates and maintains the entry (task 7.2). The delta of `architecture/modules` is already in the main spec, because the rule-id check ties every enforced slug to a requirement; archiving must not merge it a second time.

### V7. Schema and validation (task group 3)

Run on 2026-11-13 with `@fission-ai/openspec@2.0.0` as a dependency of the command.

- The schema emitted from the definition into a scratch project's `openspec/schemas/clean-backend`: `openspec schema validate clean-backend --json` answers `"valid": true, "issues": []` and `schema which` answers `"source": "project"`.
- `openspec new change add-orders` records `schema: clean-backend`. `openspec instructions plan --change add-orders --json` returns the plan's template verbatim and an instruction that ends with the question policy; `instructions specs` returns the spec template; `status` answers `applyRequires: ["plan"]`.
- The 34 scenarios generated from `flow/plan-validation` pass. On a hand-written change with a dozen defects `factory validate` named each one and exited 1; on the template left untouched it named the two placeholder tasks and the missing delta spec.
- `pnpm run check` passes with 279 tests in 26 files.

What it changed in this change:

- `flow/plan-validation` gained "An operation on a standing block records the origin it saw". The Plan section above already said such a block carries `@base`, and the archive relies on it, but no requirement made validation ask for it.
- The plan's template no longer has a bare "Verify the phase": the requirement on tasks admits no checkbox without a workstream.
- `flow/plan-validation` is copied into the main specs, as `architecture/modules` was, because the tests are generated from there.

### V8. The build (task group 4)

Run on 2026-11-13.

- The command is turned into JavaScript file by file, imports rewritten to the built names, and packed with `pnpm pack`, which fixes every date: two builds of `backend` are identical byte for byte, and one takes about a second.
- The 13 scenarios generated from `repository/build` pass, each over a repository of its own; `pnpm run check` passes with 295 tests in 28 files. The generator names the parameter of a placeholder that is a reserved word with a suffix: `<package>` arrives as `packageStep`.
- On this repository `factory build backend --check` answered `fresh`, then `stale` naming `workstreams/app-domain/SKILL.md` after that file was edited, then `fresh` again after building.
- `apm install <dist/backend> --target claude,codex` (0.35.1): 8 skills for both agents, the rule, the language server. The workstream skills inside `implement/references` were copied with it and not taken for skills of their own. The tarball arrived identical in both agents' folders.
- In a project, `pnpm add -D` of that tarball and then, from `node_modules`: `factory --version`, `prepare`, `openspec --version` (2.0.0), `openspec new change` through a link from `openspec/schemas/clean-backend` to the schema inside the installed command, `validate`, `check --workstream clean-architecture` on the reference module (exit 0) and with an `express` import in an entity (exit 1 naming the rule), `review` without a key (exit 2). A `factory.config.ts` importing `defineFactory` from `factory` loaded.

What it changed in this change:

- The guard wiring left task 4.1 for 6.1. A wiring that calls `factory guard` before that command exists would refuse every write of whoever installed the package; the build already carries whatever `hooks/` holds.
- `repository/build` is copied into the main specs.

### V9. Setup (task group 5)

Run on 2026-11-14, pnpm 12.16.1, APM 0.35.1.

- The 22 scenarios generated from `package/setup` pass, each in a project of its own installed with pnpm from stub tarballs. `pnpm run check` passes with 317 tests in 29 files.
- The README's commands ran as written in a scratch project that had its own `AGENTS.md`: `apm install <dist/backend> --target claude,codex`, `pnpm add -D ./.claude/skills/setup/assets/factory-0.1.0.tgz`, `pnpm exec factory doctor --fix`.
  - `doctor` alone listed six things lacking, exited 1 and changed no file.
  - `doctor --fix` linked the schema, set the default schema, created the three roots and wrote the section into `AGENTS.md` under the project's own lines; it left the test runner and the type checker as `missing`.
  - `apm compile` afterwards rewrote what was between the markers and nothing else: one copy of the instruction, the project's lines intact. `doctor` still found the instruction there.
  - With `vitest` and `typescript` added, `doctor` printed `nothing is lacking` and exited 0; `doctor --fix` again changed nothing.
  - The note about pending approvals appeared in every run: the agent package manager lists the language server as unapproved.
- Not exercised: asking an agent for a phase. The first commands a phase runs were run by hand (`factory openspec new change`, `instructions`, `validate`).

What it changed in this change: `apm compile` is no longer a step of installing; `package/setup` is copied into the main specs.

### V10. The guards (task group 6)

Run on 2026-11-14.

- The 22 scenarios generated from `package/write-guard` and the 14 from `package/completion-gate` pass; in the gate's scenarios the harness is real (a repository, a linked schema, a generated test) and only the change's checks are stood in for. Ten more tests feed the command what each agent hands a hook. `pnpm run check` passes with 363 tests in 32 files.
- A build of `backend` carries `hooks/guards.json`; `apm install` merged it into `.claude/settings.json` and wrote `.codex/hooks.json` ("2 hook(s) integrated"), adding `"matcher": "*"` to Claude's stop entries. `factory doctor` then expected the guards and added the note about Codex.
- A live Codex 0.166.0 session (`codex exec`) in a scratch project with the package installed:
  - Asked to create a product file with no change in implementation: `hook: PreToolUse` ran on `apply_patch`, the patch named the file by its absolute path, and Codex showed `Command blocked by PreToolUse hook:` followed by the guard's reason. The file was not created. `hook: Stop` then completed.
  - With a ready change whose check fails (an entity importing `express`), told to answer "done" and touch nothing: `Stop Blocked`, `Stop Blocked`, `Stop Completed`. `gate.json` then held three failures, "the person", and the check's findings.
  - Both runs used `--dangerously-bypass-hook-trust` and a trust setting for that invocation only. Trusting a project and reviewing its hooks by hand were not exercised.
  - `codex exec` waits for more input when its standard input is left open.
- A live Claude session was not possible: `claude -p` answered that its login had reached its time limit. Claude's side of V3 still rested on its documentation until V13.

What it changed in this change: `package/write-guard` names the installed command as harness and gained two rows (an agent's skill, the installed command); both guard specs are copied into the main specs; task 6.3 is split, Claude's half waiting for the login.

### V11. The phases (task group 7)

Run on 2026-11-14. The agent in every live session is Codex 0.166.0 (`codex exec`, sandbox `workspace-write`), in scratch projects with the built package installed by APM 0.35.1 and its hooks trusted for the invocation. The transcripts are in this change's `evidence/` folder.

By rule:

- The scenarios generated from `flow/archive` (23, against the real specification tool), `flow/verify` (12) and `flow/feedback` (9) pass, with five more tests on starting a change. `pnpm run check` passes with 413 tests in 36 files.

In live sessions:

- **Plan.** An intention of new behaviour gave a change with a plan, one delta spec of three scenarios, a tagged architecture decision, a tagged procedure and two phases; one decision was listed as an open question with the option picked, validation said not ready, and the agent stopped and showed the question. The person's answer in a second session removed the question and left the change ready. The architecture decision was not asked about, since the person had stated it. A question about the system opened no change.
- **Implement.** `factory implement` started phase 1; the run ticked its three tasks and left phase 2 untouched; the gate let it finish at the first attempt. A second run built phase 2: the anti-corruption layer, the repository, two adapters and the entry. The whole pipeline then exits 0 on that module, the two whole-product checks included.
- **An unsettled decision.** On a ready change whose plan signed no seam for a fact the use case needs, the implement phase wrote nothing, raised feedback naming the workstream and the task, and the feedback phase took it in with one open question; the change was then not ready and the agent stopped.
- **Feedback from the person.** An answer was recorded as an entry under Feedback, its question removed, and the change was ready again.
- **Verify.** Evidence matched 3 of 3 scenarios to passing tests, recorded every check as passing and the review as skipped for lack of a key. The change's procedure failed in `local`: Codex's sandbox cannot write the pnpm store, so its first step could not run. The verdict was not verified, feedback was raised and the person was asked. The person ran the procedure outside the sandbox, where it passes, and said so; verifying again gave verified, the local execution recorded on the person's word.
- **Archive.** `archived: list-customer-orders as 2026-11-14-list-customer-orders`, `every check passes`.
- **An update.** The package went from 0.1.0 to 0.1.1 to 0.1.2 during these runs. Each time `factory doctor` reported the drift between the skills and the pinned command and `--fix` pinned the new one.

What the live sessions found, all fixed before the loop was closed:

- The gate held an agent that had only planned: a ready plan with unchecked tasks counted as in implementation, so the planning session was pushed into building. Starting is now an act (X33).
- Inside the sandbox the command got empty output from its own tools (X40).
- An acceptance rule asked for the consolidated spec of a use case, which during implementation is still a delta. It now accepts the delta spec of an active change.
- The gate checked the first phase with an unchecked task, not the one that was started, so it checked the next phase's workstreams after the first phase and nothing after the last. It checks the started phase, and a started change stays in implementation until that passes.
- The first plan signed seams in folders the architecture does not have (X41).
- `factory doctor` printing only a note sent every phase to the setup skill. The phase skills now send it there only for something missing or drifted.

Not exercised live: the review with its key set (the generated scenarios stand in for the review), and in Claude anything but the guards (V13).

Seen and left as it is: in the phase 2 session the agent wrote every file through the shell, so the write guard saw none of those writes. That is the case the design already gives to the gate.

### V12. The proof (task group 8)

Run on 2026-11-14 with the package at 0.1.2.

- `factory proof` exits 0, with the agent package manager on the path and without it: the package built and put in an empty project, the command pinned from its tarball, setup with nothing lacking, the reference module written out, its tests generated and fresh, its rules holding up to `clean-architecture`, its acceptance and integration tests passing. Every step after the install runs the installed command.
- One full loop in live sessions, in an empty backend project, for an `orders` module that lists a customer's orders (V11 tells each phase). It left `openspec/specs/orders/list-customer-orders/spec.md`; the decision `money-in-integer-cents` in `openspec/adr/product/money.md`; the procedure `local-checks-and-tests` in `openspec/runbooks/operate/local-validation.md`; and the change under `openspec/changes/archive/2026-11-14-list-customer-orders`. Both consolidated blocks carry that archived name as their origin. The product is twelve files under `src` and four under `test`, and every check passes on it.
- One runbook-only change from an incident, in the same project: a plan with one procedure, no delta spec, no phase and no product file touched. It was ready at once, verified with no scenario and its procedure recorded as reviewed only for `prod`, and archived; the procedure is in `openspec/runbooks/diagnose/orders.md` with its origin. It says where the credentials are kept and holds none.

What "done" (X8) asked for is there. What stayed open then, the guards in a live Claude session (task 6.4), was done afterwards (V13).

### V13. The guards in Claude (task 6.4)

Run on 2026-11-14 with the package at 0.1.2, in a scratch project set up as the README says. The agent is Claude Code 2.1.322 run without a terminal (`-p`), permission mode `acceptEdits`, reading the project's settings only; the models were `claude-opus-5-5` in the first session and `claude-fable-5-2` in the other three. The transcripts are `claude-*.txt` in this change's `evidence/` folder.

- The session listed the package's eight skills, and the six of the flow as slash commands. The language server declaration was not among the session's plugins.
- **Write guard.** With no change in implementation, a `Write` of a product file ran the guard on `PreToolUse`; it exited 2 and the model received `PreToolUse:Write hook error: [pnpm exec factory guard]:` followed by the guard's reason. The file was not created. A `Write` over one of the agent's skills was refused the same way, as harness. With a change in implementation the same product write went through.
- **Completion gate.** With a change in implementation whose checks fail, told to answer "done" and fix nothing: `Stop` exited 2, 2 and 0. Each refusal reached the model as `Stop hook feedback:` followed by the findings, headed "attempt 1 of 3" and "attempt 2 of 3". `gate.json` then held three failures, "the person" and the findings.
- **Helper.** A subagent started with the Agent tool and told the same: `SubagentStop` exited 2, 2 and 0, so a helper is held by the same rule. The count belongs to the change and both agents add to it: the main agent's `Stop` that followed was the fourth failure and was let through without one refusal.
- The line the gate writes when it lets an agent finish with the change handed over reached neither the model nor the answer. Codex showed none in V10 either. Only `gate.json` says the change waits for the person.
- The `"matcher": "*"` the agent package manager added to the stop entries (V10) did not keep them from firing.
- The probe's first change had a delta spec with a header and no requirement. `factory validate` called it ready and `factory implement` refused to start it, because the delta does not merge: the first open question below, now seen.

Not exercised: a session in a terminal and its question about trusting the folder; `Edit`, `MultiEdit` and `NotebookEdit` (only `Write` was used); a write through the shell tool; Claude Code's own limit of eight refusals; any phase skill run by Claude.

What it changed in this change: nothing in the command or the specs. Task 6.4 keeps Claude's half, which is done. Its other half, the guards in Codex after trusting the project and reviewing its hooks by hand, tests Codex's own mechanism and needs a person at Codex's terminal; the person moved it to the workflow follow-up in `tasks.md`, for the first real use of the package with Codex.

## Risks / Trade-offs

- [APM is at 0.35 and breaks between minor versions; an open bug leaves `.claude/settings.json` broken when merging hooks] → pin the APM version `factory doctor` accepts; the proof installs into a scratch project first. The merge left a valid file in V2.
- [The agent package manager deploys a package's hooks while still listing them as unapproved] → `factory doctor` reports pending approvals so the person sees them.
- [A guard that crashes lets the write through, in both agents (V3)] → the guard refuses with exit status 2 and a reason, and the completion gate checks the harness again at the end.
- [In Codex the guards are inert until the person trusts the project and reviews each hook, and after every update that changes one] → `factory doctor` reminds the person for each agent that needs it; the README gives the steps.
- [The archive writes consolidated files and then the specification tool's archive fails] → the change stays active and the report names the files to revert; nothing is committed by the command.
- [A guard that is wrong blocks legitimate work] → the guard names the reason and the way in; the harness list is short and explicit.
- [Without the review key the judgement rows are not checked] → the evidence says the review was skipped.
- [`pnpm dlx` resolves transitive dependencies when it runs, without the project's lockfile (V4)] → it is used at most once, to pin, and not at all while the command comes as a tarball.
- [A project whose own code needs the older compiler interface, or pins another TypeScript] → the command's TypeScript is its own dependency and never the project's; `factory doctor` reports a project type checker older than the pinned one.
- [A backend whose entry does not reach a file fails `no-unused-files`] → the entry belongs to `clean-architecture` and the implement skill says so; the proof's `orders` module has one.
- [Deltas are copied into the main specs as each group generates its tests (`architecture/modules`, `flow/plan-validation`)] → the archive of this change does not merge them again; see the workflow follow-up in `tasks.md`.
- [An agent that writes files through the shell is not seen by the write guard (V11)] → the gate's harness check and the checks themselves are what hold; product code written that way outside a started change is caught by nothing until verify.
- [A procedure for a local machine may not be executable inside an agent's sandbox (V11)] → the verify phase records it as failed and asks; the person executes it and says so.
- [The same version built twice from different code gives two different tarballs under one name] → a project that pinned the first cannot install the second; the version is raised whenever the command changes.

## Open Questions

- Whether readiness should also require that the specification tool accepts the change's deltas, so that one command is the whole gate. Today a delta that does not merge fails generation, and through it the checks and the gate, but `factory validate` still says ready.
- Whether the person should be told when a change is handed over to them. Both agents drop what the gate writes when it lets the agent finish (V13), so today the person learns it from `gate.json` or from the agent's own account.
- Whether the node globals and the vetoed delivery packages are the right defaults for a backend (X10).
- Whether the product vocabulary of the review belongs in the project's configuration instead of the rubric file.
- Whether a plan's decision should be able to authorise a change to `factory.config.*` (X6).
- Whether `implement` should offer to run every remaining phase when the person asks for it (X3).
