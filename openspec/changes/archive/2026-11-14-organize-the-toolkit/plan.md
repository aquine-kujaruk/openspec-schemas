---
name: organize-the-toolkit
description: The command's files are grouped by the area of the specs they implement
created_at: 2026-11-14
created_by: the person
schema: spec-plan
---

# Organize the toolkit

## Goal

A developer who opens `toolkit/` sees five folders named after what the command does, and finds the code of a spec in the folder that carries the spec's area. Today 71 files sit side by side: the builder, the guards, the flow, the architecture linter and their tests, told apart only by name. Nothing the command does changes.

## Decisions

- Folders follow the areas of `openspec/specs` (`repository`, `package`, `flow`, `architecture`), not technical kinds (`commands`, `utils`, `types`): the spec tree is already how this repository names its parts, and a second vocabulary would have to be learned. Discarded: one folder per subcommand, which splits what the subcommands share (a change, a plan) across folders.
- What every area uses (`paths`, `types`, `config`, `platform`, the test support) goes in `core`. Discarded: leaving it at the root of `toolkit/`, which keeps the pile the change removes.
- The review moves under `architecture/`, where its spec is. Discarded: keeping `toolkit/review`, a sixth name with no area behind it.
- Tests and step adapters stay next to the file they prove, in the same folder.
- `cli.ts` stays at the root of `toolkit/`: it is the entry the package's manifest names.
- The Gherkin skills are left as they are, declared in the package's manifest and copied from the pinned tools when a package is built. Declaring them as dependencies the agent package manager installs is a change of what a package carries, with specs of its own; it is not folded into a move of files.

## Open questions

## Architecture decisions

### Decision: toolkit-follows-the-spec-areas · The command's code is grouped by spec area

@adds @area:product @topic:layout @applies:toolkit @enforced:layout-test

Every file under `toolkit/` other than its entry SHALL sit in the folder named after the area of `openspec/specs` whose behaviour it implements (`repository`, `package`, `flow`, `architecture`), or in `core` when every area uses it. A file SHALL import from another area only through that area's files, never by reaching into `core` for something an area owns.

**Why** The specs already name the parts of this repository; code filed under the same names is found without a map, and a file with no area shows that a spec is missing or that the file does two things.

**Alternatives** Folders by technical kind, or one per subcommand. Both group files that change for different reasons.

**Consequences** A new file needs an area before it is written. A test fails when a file sits at the root of `toolkit/` or in a folder that is not one of the five.

## Procedures

## Phases

### Phase 1: The files are in their folders

The layout:

```
toolkit/
  cli.ts
  core/           paths, types, config, platform, testing
  repository/     schema, schema-yaml, schemas, build
  package/        doctor, proof, guard, gate
  flow/           change, plan, consolidated, validation, validate, implement, feedback, evidence, verify, archive, merged
  architecture/   project, graph, rules, compose, archunit, oxlint, check, generate, prepare, test, expect, expectations, expect-file, examples, example-file
    review/
```

**Tests**

The tests that exist, unchanged but for their imports, and one new test for the decision above.

- [x] Move every file with `git mv` to the folder the layout gives it, each test and step adapter with the file it proves
- [x] Rewrite the imports, the entry's subcommand table, the build's list of what the command is compiled from, `package.json` (`bin`, `exports`, the `factory` scripts), `vitest.config.ts` and where `factory generate` looks for step adapters
- [x] Add the test that fails for a file at the root of `toolkit/` other than `cli.ts` and for a folder outside the five
- [x] Raise the package version, since the command's files change place inside the tarball
- [x] Verify `pnpm run check` passes with no test edited beyond its imports, `factory build backend --check` is fresh after a build, and `factory proof` exits zero

## Feedback

## Next step

Build it through the implement phase. After it, the question the person raised on the same day: whether a package should declare the skills and servers it needs and let the agent package manager install them, instead of carrying copies.
