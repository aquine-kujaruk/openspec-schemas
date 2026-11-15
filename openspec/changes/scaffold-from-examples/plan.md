---
name: scaffold-from-examples
description: The implementer starts every short, rule-fixed file from a scaffold kept in its layer's examples, rendered by a pinned CLI
created_at: 2026-11-15
created_by: the person
schema: spec-plan
---

# Scaffold from examples

## Goal

An agent building a clean-backend workstream writes no boilerplate by hand. Every file of a short kind whose shape a rule already fixes (schema, ACL, repository interface, entity, value object, exception family, in-memory repository), and every base of the `shared` module those files lean on, starts from a scaffold kept in the `## scaffolds` section of its layer's examples. One shell line renders the scaffold with `pnpm dlx ejs@7.0.2`. The scaffold's text never passes through the model's output, which saves tokens, and the file starts in the shape the rules expect, which bounds the agent. This repository's tests prove that every scaffold renders into a file its layer's rules accept.

## Decisions

- The renderer is the ejs CLI, called as `pnpm dlx ejs@7.0.2` at an exact version and not added to the package's `tools`. The person chose it on 2026-11-15 and wants it called through the package runner. Discarded: scaffdog (needs a config folder; last release 2024-09), hygen (unmaintained since 2022), no CLI (saves no output tokens and bounds nothing), and pinning ejs as a package tool.
- Scaffolds live in a `## scaffolds` section of each `<layer>.examples.md`, one block per kind, whose info string is `ejs <destination>`, with `<module>` and `<name>` where the path varies. A `sed` line extracts the block and ejs reads it through process substitution, so no temporary file is written. `ejs -o` does not create folders, so the command starts with `mkdir -p`. The person chose it on 2026-11-15. Discarded: one `<kind>.scaffold.ejs` file per kind (more files, which the person wanted to avoid), and having the model pass the scaffold as text (the ejs CLI takes a template only as a file, so the model would write it out in full).
- The build does not change. Each workstream's examples already reach the installed package at `.claude/skills/implement/references/workstreams/<id>/` (`toolkit/repository/build.ts:229`). Discarded: a remote URL per scaffold, which would need the network and a second version pin.
- Scaffolded kinds are short skeletons that a rule already fixes, plus the `shared` bases: `domain.exceptions.ts`, `validation.exceptions.ts`, `validation.schema.ts` (`validateSchema`) and `http-api.adapter.ts`. The entity and value-object scaffolds import `validateSchema` and their schema's `<Name>Schema` and `<Name>Props`. Every scaffold fixes the file suffix of its layer's vocabulary. The person chose it on 2026-11-15. Discarded: a scaffold for every vocabulary kind (use case, service, aggregate, repository implementation and adapter are mostly logic), and only schema and ACL.
- Controller, DTO and event from the dev-harness scaffolder get no scaffold: clean-backend has no delivery layer and no vocabulary folder for them. `scaffold.js` and `arch-model.js` are not ported.
- The agent writes the destination path and the name casings (`Name=Invoice name=invoice`) straight on the command line. Each workstream skill gives the full command for each of its kinds. The person chose it on 2026-11-15. Discarded: a `factory scaffold` subcommand, which is code of our own and would make ejs a dependency of the command.
- The `shared` bases that are missing are rendered at the implement skill's seam step, before the first task, because `app-domain`, `infrastructure` and `adapters` run in parallel and all three need them. The person chose it on 2026-11-15. Discarded: chaining a `test -f … ||` guard into every command (parallel workstreams race on the same file), and having `factory doctor --fix` or `factory prepare` write them (the harness would write product code).
- spec-plan gets no scaffolds: it builds no product code.
- This repository's test renders the scaffolds with ejs 7.0.2 as a dev dependency (with `@types/ejs` 3.1.5), the same version the skills call. It renders every scaffold together, so each one finds what it imports, and runs every workstream's rules on the result. `acl-adapter-paired` is exempt, because an ACL waits for the adapter another workstream writes. A scaffold without placeholders must copy the reference file at its path. Discarded: a hand-written replacement of the placeholders, which could drift from what ejs renders.
- Found while building: repository interfaces and ACLs are seams, which the implement skill writes before the first task, so they start from their scaffold at that step. The implement skill (shared by every schema) carries the generic command; the app-domain skill carries the full command for each kind it writes (schema, entity, value object, exception family, in-memory repository); the infrastructure and adapters skills say that their ACLs and `http-api.adapter.ts` come from the seam step.
- Found while building: `factory doctor --fix` could not repair a drifted pin. pnpm 11 re-resolves the old tarball that the package update removed, and `pnpm add` fails. The repair now rewrites the specifier with `pnpm pkg set` and runs `pnpm install`. This is the behaviour `package/setup` already specifies, and its scenario was failing before this change.
- Placeholders are `<%= Name %>` (PascalCase) and `<%= name %>` (kebab-case), and `<%= camel %>` only where a scaffold needs it. Discarded: the dev-harness `__NAME__` markers, which ejs does not read.

## Open questions

## Architecture decisions

### Decision: scaffold-first · A scaffolded kind starts from its scaffold

@adds @area:product @topic:implementer @applies:schemas @enforced:scaffold-test

A workstream skill SHALL make the scaffold's render command the first step for every file of a kind its layer scaffolds, and the agent SHALL fill that file afterwards instead of writing it from nothing. A scaffold SHALL live in the `## scaffolds` section of its layer's examples, and it SHALL render into a file that its layer's vocabulary and single-file shape rules accept.

**Why** A scaffold saves the tokens of boilerplate the agent would otherwise emit, and starts every such file in the shape the rules check. Keeping it in the examples means each layer has one file to read and maintain.

**Alternatives** Offering the scaffold as an optional shortcut: the agent may skip it, and then it bounds nothing. A scaffold file per kind: more files for the same content.

**Consequences** A change to a layer's rules that alters a scaffolded kind's shape must update its scaffold in the same change, or this repository's tests fail. A project's agent needs network access for the first `pnpm dlx` call on each machine.

## Procedures

## Phases

### Phase 1: Every scaffold renders into a file its layer accepts

**Tests**

A repository test extracts each ```` ```ejs ```` block from every workstream's examples, renders it with a sample name and module, and runs the layer's vocabulary and single-file shape rules on the result. It fails naming the scaffold that breaks one. The scenarios of the new requirement of `implementer` have no step adapter and are proved by that test.

- [x] Add a `## scaffolds` section with schema, entity, value-object and exception-family scaffolds, plus the `shared` bases `domain.exceptions`, `validation.exceptions` and `validation.schema`, to `app-domain/domain.examples.md`
- [x] Add the repository-interface scaffold to `app-domain/application.examples.md` and the in-memory repository scaffold to `app-domain/acceptance.examples.md`
- [x] Add the ACL scaffold to `infrastructure/infrastructure.examples.md` and the `shared` base `http-api.adapter` to `adapters/adapters.examples.md`
- [x] Make the examples reader ignore `## scaffolds` as rule cases
- [x] Add the repository test that renders every scaffold and checks it against its layer's rules
- [x] Check whether `ejs -o` creates missing folders, and settle the command each skill gives (`mkdir -p` in front if it does not)
- [x] Verify `pnpm run check` passes

### Phase 2: The skills build from scaffolds

**Tests**

Phase 1's test, unchanged. The skills are prose, checked by review.

- [x] In the skills of `app-domain`, `infrastructure` and `adapters`, make the full render command the first step for each scaffolded kind, before filling the file
- [x] In the implement phase skill's seam step, render every missing `shared` base before the first task
- [x] Raise the package version
- [x] Verify `pnpm run check` passes, `factory build backend --check` is fresh after a build, `factory proof` exits zero, and `factory verify scaffold-from-examples --proved implementer` records the evidence

## Feedback

## Next step

Build it through the implement phase, then archive it with `factory archive`.
