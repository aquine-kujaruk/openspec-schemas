# Proposal

## Why

Stock OpenSpec plans a change in four artifacts that mix acceptance behaviour, durable decisions and change-local planning, and nobody reads them all. The factory that already enforces Clean Architecture (`arch-linter-poc/.factory`, commit `827d7a8`) only runs where Vite+ is and cannot be installed into another backend. This repository becomes the home of OpenSpec schemas that each carry a whole flow (plan, implement, verify, archive, with feedback re-entering the same change), built from shared resources and compiled into packages a project installs. Its first schema is `clean-backend`.

## What Changes

- **A repository of schemas.** Resources live by kind (workstreams, phases, validators, question policies, templates, the command). A schema is a short definition that picks resources; a package is a manifest that lists schemas; a build emits the installable package. A project installs one built package, which may hold several schemas.
- **The `clean-backend` schema.** Two artifacts per change: `specs` (Gherkin acceptance deltas, the form the test generator demands) and `plan` (goal, decisions, phases with seams, tests and tasks per workstream, plus tagged architecture decisions and procedures). A change always has a plan; it has specs only when behaviour changes.
- **Five phase skills of our own** over the specification tool's command line: plan, implement, verify, archive, feedback. No skill the specification tool generates is edited.
- **Planning writes the artifacts as it decides.** The first proposal comes from the agent's own decisions; each answer from the person is one update. Planning reads the consolidated decisions and procedures and tags, in the plan, what the change does to them.
- **Archiving applies what the plan declares.** It merges the spec deltas, applies the tags to the consolidated decisions and procedures, stamps each written block with its origin, and never asks. A tag that no longer holds stops the archive and comes back as feedback.
- **Two guards.** One judges every write an agent is about to make (product code only while a change is in implementation; the harness never). One judges every attempt to finish (the change's checks pass, or the agent goes on; the third failure in a row hands over to the person). A new lint rule forbids switching the harness off from inside the code.
- **Verify ships in the package.** Checks, generated acceptance tests and evidence always; the rubric review only where the project configures a key.
- **One door to install.** The agent package manager places skills, instruction and guards for each agent; the first phase run pins the command in the project as a locked development dependency. Node tools are run and installed with pnpm only.
- **The implementer is Clean Architecture only.** Workstreams `app-domain`, `infrastructure`, `adapters`, `clean-architecture`, `integrate`, ported from `arch-linter-poc` with their own command in place of Vite+. The React workstreams are left for a later `clean-frontend` schema.
- **Baseline import.** The layer rule specs and the implementer spec that still hold are brought over as this repository's starting specs (see `design.md`, Baseline).

## Capabilities

### New Capabilities

- `repository/build`: building a package from schema definitions and a package manifest.
- `package/setup`: what a project has after installing a built package and running its first phase, and what setup reports when something is missing.
- `package/write-guard`: judging a write an agent is about to make.
- `package/completion-gate`: judging an agent's attempt to finish.
- `flow/plan`: turning an intention into a change by a first proposal and one update per answer.
- `flow/plan-validation`: telling by rule whether a change can be handed to the implementer and the archiver.
- `flow/implement`: building one phase of a ready change.
- `flow/verify`: showing with evidence that a built change does what its artifacts ask.
- `flow/archive`: closing verified changes and consolidating their specs, decisions and procedures.
- `flow/feedback`: bringing a finding about a change back into the same change.
- `architecture/modules`: only the new rule `no-harness-escapes`; the rest of this capability arrives with the baseline import.

### Modified Capabilities

None. The repository is new.

## Impact

- **New code here:** the `factory` command (check, generate, expect, prepare, validate, guard, gate, archive, doctor, build, proof), the build, five phase skills, the guard wiring, the `clean-backend` definition and its templates.
- **Ported code:** five workstreams, the toolkit and the review from `arch-linter-poc@827d7a8`, moved off Vite+.
- **Pinned by a built package:** the specification tool, the linter, the import-boundary tool, the architecture test library, the test generator, the spec converter and the type checker. The agent package manager must be on the machine.
- **A project that installs a package** gains one development dependency, a `openspec/` tree with `specs`, `adr` and `runbooks`, and skills, instruction and guards for each agent. It keeps its own test runner and type checker.
- **Untouched:** `arch-linter-poc`.
- **Not published:** nothing is pushed to a registry or a remote by this change.
