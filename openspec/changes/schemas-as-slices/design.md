# Design: schemas as slices

## Context

The bootstrap change left one schema, `clean-backend`, one package, `backend`, and the command `factory`. Its resources sit at the root by kind, on the idea that schemas pick from a common pool. With one schema that reads as nine folders nobody can tell apart, and the pool hides what belongs to what.

What the code does today, read on 2026-11-14:

- `toolkit/schema.ts` resolves a definition's resources from fixed root folders (`workstreams/`, `validators/`, `questions/`, `templates/`), and a definition from `schemas/<name>.ts`.
- `factory validate` loads the schema the change was made with. The gate, the verification, the write guard and the tools' configuration load the project's default schema (`projectSchemaName`).
- The validator `standard` reports a change as not ready when a task names no workstream of the schema.
- The specification tool records the schema in each change and takes `--schema` when a change is opened; `openspec schemas` lists the ones a project has, with their descriptions.
- A built package installs its skills flat (`plan`, `implement`…), one copy whatever the number of schemas, and one command.

## Goals / Non-Goals

**Goals**

- A developer opens `schemas/<name>/` and sees everything that schema alone is made of.
- What several schemas use has one place, and a rule checked by the build says which place a resource belongs in.
- A project can hold several schemas; a change is judged by its own.
- The plan phase picks the schema from the intention.
- This repository plans its own work with a schema it builds.

**Non-Goals**

- `frontend-react` and `legacy-to-specs`.
- Several products in one repository: one schema per folder of a monorepo, a guard that knows which folder a change may write, specs per product.
- Packages installed side by side, each with its own skills under a prefix. A package stays a selection of schemas built together (see D6).
- A rule that checks a phase is worth having on its own. It stays an instruction to the planner.

## Decisions

### Said by the user (2026-11-14)

- **S1. Slices.** One folder per schema with its own things; what several schemas share goes in a shared folder of the schemas. Few folders at the root.
- **S2. The schema follows the intention.** A project has several schemas; the plan phase must know which ones and choose, possibly more than one.
- **S3. End to end where possible.** Inside one deliverable the slice goes from end to end, so a framework is a workstream of the change and not another change. Front and back of a monorepo are two deliverables and two changes.
- **S4. Setting a project up may be an instruction** the person pastes to an agent, saying which schemas they want.

### Assumed by me

- **D1. Where a resource lives.** A resource lives in the folder of the definition that names it. A definition that extends another finds the base's resources in the base's folder. A resource named by two definitions neither of which extends the other lives in `schemas/shared/`. The build fails naming the resource and its place when it is held anywhere else. Alternative: everything used twice goes to `shared`, counting a schema and the ones that extend it; rejected because one variant of `clean-backend` would push every Clean Architecture workstream into `shared`.
- **D2. The flow is shared from the start.** The phase skills, the `setup` skill, the flow instruction and the guards' wiring are carried by every package, are named by no definition, and live in `schemas/shared/`. D1 does not apply to them.
- **D3. A base schema, `spec-plan`.** It is the plan and the delta specs: both templates, the validator `standard`, the question policy `ask-on-commitment`, no workstream. `clean-backend` extends it and adds its workstreams, its defaults, its rubric and the instruction lines about workstreams. So today's resources split as the layout below shows. The name follows CodelyTV's `codely-spec-plan`, which has the same two artifacts.
- **D4. Clean Architecture stays in `clean-backend` for now.** By D1 the five workstreams move to `shared` the day a second schema names them without extending `clean-backend`. The schema keeps its name: renaming it buys nothing until that second schema exists.
- **D5. A task names a workstream only when the schema has some.** For `spec-plan` a task is a checkbox inside a phase, and one that names a workstream makes the change not ready. Alternative: a schema of this repository with workstreams of its own (`toolkit`, `resources`, `packages`); rejected for now because nothing would check them.
- **D6. One package is one selection of schemas.** `packages/backend.ts` lists `clean-backend` and `spec-plan`; a project that wants three schemas installs a package whose manifest lists three. One command, one copy of each phase skill, one pair of guards. Alternative: one package per schema, installed as plugins with prefixed skills; rejected because it gives three `plan` skills for the person to choose from and runs each guard once per package.
- **D7. The change's schema everywhere.** The gate, the verification, starting and the write guard load the schema of the change they judge. A change made with a schema the package does not define is refused by name, as validation already does.
- **D8. Product code opens to the schema that builds it.** The write guard lets a product path through only for a started change whose schema has workstreams. A started `spec-plan` change opens nothing: what it writes is neither product nor harness and was never guarded.
- **D9. The project's architecture.** The tools (rules, zones, product roots) are composed from the one schema with workstreams the project has. With two, the command stops and says the project must name one in `factory.config.ts`; that case waits for the monorepo change. The default schema in `openspec/config.yaml` no longer decides this.
- **D10. The plan phase reads `factory schemas`.** A new subcommand lists the package's schemas in the project with the description of each, and the description says when to use it. The plan skill opens each change with `--schema`. When an intention needs two schemas it opens two changes and each plan names the other under Decisions. No ordering between changes is built. The flow instruction gains one line pointing at the subcommand; no list of schemas is written into an instruction file.
- **D11. The rubric goes with the architecture.** The rubric judges Clean Architecture code, so it lives in `schemas/clean-backend/review/` and the review's code moves into `toolkit/`. The review keeps judging the product with the rubric of the project's architecture (D9). A project with no architecture schema has no review, and the evidence says it was skipped, as it does today without the key; no requirement changes for that.
- **D12. This repository's own schemas.** `factory generate` in this repository also writes `openspec/schemas/<name>/` for each schema, as generated files git ignores, and `factory generate --check` reports them stale. `openspec/config.yaml` names `spec-plan`.
- **D13. The setup instruction is documentation.** The README gets a block to paste: install the built package, pin the command, run `factory doctor --fix` until nothing is lacking, and for Codex tell the person to trust the project and review the hooks. No new skill: `setup` already holds the steps once the package is in.
- **D14. Version 0.2.0.** The command's code and the package's content both change.

### Layout

```
schemas/
  spec-plan/
    schema.ts
    templates/            plan.md, spec.md
    validators/standard/
    questions/            ask-on-commitment.md
  clean-backend/
    schema.ts             extends spec-plan
    workstreams/          app-domain, infrastructure, adapters, clean-architecture, integrate
    review/               RUBRIC.md
  shared/
    phases/               plan, implement, verify, archive, feedback
    skills/               setup
    instructions/         flow.md
    hooks/                guards.json
packages/                 backend.ts
toolkit/                  the command, the review's code included
openspec/                 specs, changes, and the generated schemas
```

Step adapters and generated tests stay next to what they prove: a workstream's with the workstream, the validator's with the validator, the command's in `toolkit/`.

## Verified

Built on 2026-11-14. `pnpm run check` passes with 434 tests in 36 files, `factory build backend --check` is fresh, `factory proof` exits zero and the specification tool validates every spec in strict mode. The package is at 0.2.0.

- **The move.** Groups 1 and 2 were built together: with the layout of the design, `clean-backend` cannot name the templates, the validator and the question policy itself, since they sit in `spec-plan`'s folder. Before the base schema's description was reworded, the schema file a build emits for `clean-backend` was byte for byte the one 0.1.2 emitted, and the built package held the same set of files.
- **Where a resource lives (D1).** Both outlines of the new requirement pass, on fixtures laid out as this repository is.
- **The project's architecture (D9).** A project whose default schema is `spec-plan` is still checked with `clean-backend`'s rules. Naming one of several is the field `schema` of `factory.config.ts`.
- **The change's schema (D7, D8).** A started `spec-plan` change lays no product root, opens no product path, is held by the gate only for an altered harness, is verified with no workstream check, and archives.
- **Live, each agent on its work profile** (transcripts in `evidence/`): Codex planned an incident as a `spec-plan` change after running `factory schemas`; Claude planned a new behaviour as a `clean-backend` change; with a `spec-plan` change started, Claude's write under `src` was refused by the guard, naming the change and its schema, and its write under `docs` went through.
- **The block to paste (D13).** Given to Claude in an empty project, it left the package installed for both agents, the command pinned at 0.2.0, nothing lacking and both schemas listed, and reminded the person of what stays theirs in Codex. The setup names no version for the test runner, so the agent added the newest.
- **This repository (D12).** In a scratch copy, a change opened with the default schema was `spec-plan`, validated, started, was let through by the gate, verified and archived with the repository's own command.

What building it changed:

- **D15. Verification runs the checks of the change's own schema**, not of the whole project. D7 already said so; the code ran every workstream of the project's schema, which failed a `spec-plan` change for product rules it cannot touch.
- **D16. In this repository, archiving checks only what is generated.** The whole product check judges a product, and the repository is none.
- **D11 as built.** A schema finds its rubric in its own folder or in the folder of one it extends. The review stops, saying so, when the project's schema has none, and the evidence records it as skipped.
- **`factory schemas`** lists the schemas the installed package says it carries, so the specification tool's own schema is never offered.

Known limit: in this repository `factory verify` cannot match the scenarios of a delta spec to a test. Its generated tests live next to their step adapters and not under an acceptance root, and some capabilities (`flow/plan`, `flow/implement`) have no generated test at all. So a change of this repository that has delta specs can be planned, validated and started with `spec-plan`, and not yet verified or archived by the command. It is the first open question below.

## Risks / Trade-offs

- [Every import and every path constant moves at once] → the move is its own task group, done before any behaviour changes, and `pnpm run check` must pass with the tests unchanged before the next group starts.
- [`spec-plan` in a project lets a change skip the architecture] → D8: it cannot write product code, and the plan skill's choice is by the descriptions, which say `spec-plan` is for what no architecture schema covers.
- [A project on 0.1.2 has its default schema decide the architecture] → D9 picks the same schema there, since `clean-backend` is the only one with workstreams.
- [The specs name resource paths that move] → `implementer` and `architecture/linting` get deltas for the requirements that name them; the Purpose lines of the architecture specs are corrected by hand when the deltas are copied.
- [Two changes for one intention drift apart] → each plan names the other; nothing else holds them together until the monorepo change.

## Open Questions

- How a change of this repository that has delta specs is verified: by teaching `factory verify` where this repository keeps its generated tests and what proves a capability that has none, or by keeping `pnpm run check` as its verification and archiving such changes with the specification tool directly, as the bootstrap was.
- Whether `clean-backend` should be renamed once `frontend-react` exists, and whether the Clean Architecture workstreams then form a named pack under `shared`.
- Whether a schema should say which folder of the project it governs. It is the first decision of the monorepo change.
- Whether `spec-plan` is the right name.
- The open questions the bootstrap change left: readiness and the specification tool's validation, telling the person a change was handed over, and the Gherkin skills copied or vendored.
