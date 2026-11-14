# Tasks

Node tools are installed and run with pnpm only. A task that finds a design assumption false stops the group and comes back as feedback on this change before anything else is built.

## 1. Verify what the design assumes

- [x] 1.1 Run OpenSpec 2.0.0 in a scratch project with a hand-written `plan` + `specs` schema (`apply.requires: [plan]`, `tracks: plan.md`, neither artifact requiring the other): `status`, `instructions`, `validate --strict`, `archive -y`, a change with `skip_specs: true`, and a schema directory that is a link. Record each command and its JSON under `design.md` as "Verified"; if one fails, repeat on 1.17.0 and record which version the package pins.
- [x] 1.2 Install a hand-made agent package from a local path into a scratch project for `claude` and `codex`: confirm a skill folder is copied whole with its references, the guard wiring lands where each agent reads it and leaves the agent's settings file valid, `apm compile` writes the instruction for both agents without overwriting text the project already had, and the language server declaration reaches Claude. Record the APM version used and what each agent received.
- [x] 1.3 Find which events each agent fires before a file write, on finishing, and when a helper agent finishes. Record the table. If Codex has no event before a write, record that the write guard is Claude-only and that the completion gate carries Codex.
- [x] 1.4 Run the command stub once with `pnpm dlx` from a local tarball, then add it as a development dependency at an exact version; confirm the lockfile records it and note how transitive dependencies were resolved in the `dlx` run.
- [x] 1.5 Find a linter version and a type checker version that work together with type-aware linting, and the command that starts the type checker's language server; record them as the versions the `backend` manifest pins.

## 2. Repository skeleton and baseline

- [x] 2.1 Create the pnpm workspace, the TypeScript configuration and the folders of the design's layout, with a `factory` command stub; verify `pnpm exec factory --version` prints the workspace version.
- [x] 2.2 Import the baseline specs into `openspec/specs/` following the design's Baseline table; verify `openspec validate --specs --strict` passes and that a search of `openspec/specs/` finds no `vp `, no `.factory/` and no requirement about hooks, stores, controllers, view-models or JSX.
- [x] 2.3 Port the five workstreams (`app-domain`, `infrastructure`, `adapters`, `clean-architecture`, `integrate`) with their rules, examples, step adapters and skills; verify every rule slug in the imported specs has its implementation and its example cases (the rule-id and case-id checks pass).
- [x] 2.4 Port the toolkit off Vite+: `factory check`, `generate`, `expect`, `prepare` call the linter, the test runner and the boundary tool directly; verify `factory generate --check` is clean and the linter's own generated tests pass in the sequential and the map-reduce topology.
- [x] 2.5 Port the review without rubric rows S01–S04, on the command's own TypeScript (the one that still has the compiler interface, design V5); verify its tests pass with the fake decision client and that `factory review` exits 2 naming the key variable when no key is set.
- [x] 2.6 Add the rule `no-harness-escapes` to the whole-core rules with its four example cases; verify `factory expect` records a finding for each case and the scenario generated from `specs/architecture/modules` passes. Once 2.2 has landed, validate this change again and drop the delta's Purpose if validation asks for it.

## 3. Schema, templates and plan validation

- [x] 3.1 Write the `clean-backend` definition, the `plan.md` and `spec.md` templates, the validator and the `ask-on-commitment` question policy; verify the emitted `schema.yaml` passes `openspec schema validate clean-backend`.
- [x] 3.2 Implement `factory validate <change>`; verify the tests generated from `specs/flow/plan-validation` pass.

## 4. Build

- [x] 4.1 Write the `backend` manifest and implement `factory build <package>`; verify the tests generated from `specs/repository/build` pass and `dist/backend` holds the schema, the five phase skills once, the `setup` skill with the command tarball in its assets and the instruction. The tarball holds the command compiled to JavaScript (design V6); verify it runs from a project's `node_modules`.
- [x] 4.2 Implement the freshness check; verify it reports `stale` after editing one workstream skill and `fresh` after building again, and that two builds from the same resources are byte-identical.

## 5. Setup

- [x] 5.1 Implement `factory doctor` and `factory doctor --fix`, including the managed section for an instruction file the project wrote and the report of approvals the agent package manager lists as pending; verify the tests generated from `specs/package/setup` pass.
- [x] 5.2 Document installation in `README.md` (install the built package, pin the command, run setup, run a phase, and for Codex trust the project and review the hooks, again after each update that changes them); verify the documented commands run as written in a scratch project.

## 6. Guards

- [x] 6.1 Implement `factory guard` and its wiring for each agent according to design V3: it reads a path from Claude and every file of a patch from Codex, and refuses with exit status 2 and the reason on stderr; verify the tests generated from `specs/package/write-guard` pass. The wiring lives in `hooks/`; verify a build of `backend` carries it.
- [x] 6.2 Implement `factory gate` with the count of failed attempts and its wiring for the main and the helper agent; it answers in the form each agent's stop event accepts (design V3); verify the tests generated from `specs/package/completion-gate` pass.
- [x] 6.3 Exercise both guards in a live Codex session in a scratch project: a refused write, a refused finish, and the hand-over after the third failure; record what the agent showed, since V3 comes from documentation and source and not from a run.
- [x] 6.4 Do the same in a live Claude session, and add what only Claude has: a helper agent that finishes while the change fails (design V13).

## 7. Phases

- [x] 7.1 Write the flow instruction and the `plan` skill; verify in a scratch project that an intention of each kind in `specs/flow/plan` gives the artifacts its scenarios state, and keep the transcript with this change's evidence.
- [x] 7.2 Write the `implement` skill, which has `clean-architecture` create and maintain the entry, and make `factory generate` read the delta specs of the change in implementation (an agent cannot write the consolidated specs); verify on a planned two-phase change that one run builds one phase and that an unsettled decision ends in feedback with the artifacts unchanged.
- [x] 7.3 Write the `verify` skill and the evidence format; verify the scenarios of `specs/flow/verify`, with and without the review key.
- [x] 7.4 Implement `factory archive` and write the `archive` skill; verify the tests generated from `specs/flow/archive` pass.
- [x] 7.5 Write the `feedback` skill; verify the scenarios of `specs/flow/feedback` from each of the four sources.

## 8. Proof

- [x] 8.1 Implement `factory proof`: an empty project, the built package installed from a local path, setup with repair, generated tests and checks on the reference module; verify it exits zero.
- [x] 8.2 Run one full loop in a scratch backend project for an `orders` module (list orders): plan, implement, verify, archive; verify that `openspec/specs`, `openspec/adr` and `openspec/runbooks` each hold what the change declared and that every consolidated block carries its origin.
- [x] 8.3 Run one runbook-only change from an incident in the same project: no delta spec, no product code; verify it archives and its procedure is consolidated under its purpose.

## Workflow follow-up

- Archive this change, then switch this repository's own `openspec/config.yaml` to the schema it builds. Deltas are copied into the main specs as each group generates its tests (`architecture/modules` in 2.6, `flow/plan-validation` in 3.2, `repository/build` in 4.1, `package/setup` in 5.1, `package/write-guard` and `package/completion-gate` in 6.1 and 6.2, the five `flow` specs in group 7): every delta of this change is already there: archive without merging them again.
- The first time the package is used with Codex in a real project, trust the project and review its hooks with `/hooks`, and confirm the guards run without `--dangerously-bypass-hook-trust` (`hook: PreToolUse` and `hook: Stop` in the session). Every live Codex session of this change used that flag (design V10, V11), so Codex's own trust and review were never exercised; the person decided on 2026-11-14 to leave it for that first use.
- Decide whether and where to publish the command and the built package.
- Next schemas: `clean-frontend` (Clean Architecture plus the React workstreams) and `legacy-to-specs`.
- The open questions in `design.md`.
