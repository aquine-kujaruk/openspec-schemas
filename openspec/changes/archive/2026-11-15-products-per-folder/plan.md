---
name: products-per-folder
description: A project declares several products by folder, each governed by a schema, and every change builds one product, linked to the other changes of its intention
created_at: 2026-11-15
created_by: the person
schema: spec-plan
---

# Products per folder

## Goal

One repository can hold several products, for example `apps/api` and `apps/worker` built with `clean-backend` and `packages/contracts` built with `spec-plan`. `factory.config.ts` declares each product with its folder, its schema and its own settings. Every change builds exactly one product. The write guard opens only that product's folder, and the gate, verify, generation, checks and review run over that product alone. The changes of one intention name each other, and validation checks that they do. A project that declares no products works as it does today.

## Decisions

- Products are declared in `factory.config.ts` under `products`, for example `api: { root: 'apps/api', schema: 'clean-backend', modules: 'src/*' }`. The person chose it on 2026-11-15. Discarded: the schema naming the folder it governs (it ties a published schema to one layout, and two backends would need two schemas), and one `factory.config.ts` per folder (the guard and the gate would have to find and read N files on every write).
- A product's settings resolve in three layers: the defaults of its schema, then the top level of `factory.config.ts`, then the product's own entry. Its roots (`modules`, `acceptance`, `integration`, `entry`) are relative to the product's `root`.
- A project with no `products` has one implicit product at the repository root. Its specs stay at `openspec/specs/<module>/<use-case>/spec.md` and nothing about it changes. The top-level `schema` key of D9 (schemas-as-slices) keeps working for that case. With two schemas that have workstreams and no `products`, the command's error now says to declare `products`.
- The changes of one intention are linked in their `.openspec.yaml` under `x-linked`, a list of change names. `factory validate` reports a change not ready when a linked change does not exist, active or archived, or does not link back. No order and no contract between them is enforced. The person chose it on 2026-11-15. Discarded: also citing a contract spec that validation checks (more work, kept for later), and free text under Decisions (what D10 has today, which nothing checks). The list allows one intention to span three products: back, front and a shared one.
- Code shared between products, such as `packages/contracts`, is a product of its own, changed by its own change. The person chose it on 2026-11-15. Discarded: letting any product change write it (the guard would no longer know who owns it), and leaving shared code out.
- A shared product is declared with `spec-plan`. A product's folder opens to the change of that product, whatever its schema; a product declared with a schema that has no workstreams gets no architecture rules and no review, only its plan, its specs and its own tests. This replaces D8 ("product code opens to the schema that builds it") with "a folder opens to the change whose product it is". The person chose it on 2026-11-15. Discarded: a new `library` schema (one more schema to keep before any project needs it), and waiting for a real case.
- The monorepo is proved with two `clean-backend` products (`apps/api`, `apps/worker`) and one `spec-plan` product (`packages/contracts`) in a test project. The person chose it on 2026-11-15. Discarded: building the front schema first, and building both in one change.
- One `openspec/` at the repository root, never one per product. OpenSpec finds its root by walking up from the working directory (`dist/core/planning-home.js:24-38` of `@fission-ai/openspec` 2.0.0), and the agent and the hooks work from the repository root, so a nested root would be invisible to them. OpenSpec stores are separate planning repositories, worksets are personal editor views and `references` gives read-only access to specs (`dist/core/working-set.js:4-27`, `dist/core/worksets.js:12-19`), so none of them fits one repository with several products.
- With products, specs live at `openspec/specs/<product>/<module>/<use-case>/spec.md`, the default `productSpecs` of a product. OpenSpec discovers specs recursively and archives deltas into the same nested path (`dist/utils/spec-discovery.js:21-66`, `dist/core/specs-apply.js:72-81`). Changes stay flat under `openspec/changes/`, because OpenSpec flags nested changes (`dist/utils/nested-change.js:7-35`).
- A change records its product as `x-product` in its `.openspec.yaml`. OpenSpec keeps `x-*` keys and ignores them (`dist/utils/change-metadata.js:10-21`), and it has no field of its own for a working scope (`affected_areas` is parsed but read by nothing). The plan skill writes `x-product` and `x-linked` right after opening the change; the write guard treats `.openspec.yaml` as one of the change's own artifacts. Assumption, not agreed: a `factory` subcommand that opens the change and writes both keys would be the alternative, if writing YAML from the skill proves fragile.
- In a project with products, every change names a declared product, and the change's schema must be that product's schema. A change that builds two products is two changes (S3 of schemas-as-slices, `design.md:38`, and the person's own reading: front and back are two deliverables).
- Lint, check, prepare, generate, test, review and the evidence digest run once per product, each with its own zones, tsconfig and rubric, and a change is judged only by its own product. The module-level singletons of `toolkit/architecture/project.ts` become a function of the product. Reason: fallow's `requireAllFiles` would fail `every-file-in-a-zone` as soon as a second product exists (`toolkit/architecture/compose.ts:85-107`), and verify and the gate take the topology and the rubric from the project instead of from the change (`toolkit/flow/verify.ts:93-164`, `toolkit/package/gate.ts:118-123`).
- The workstream skills' Owns lines, the scaffold destinations and the commands in the skills stop hard-coding `src/` and `test/` and speak of the product's configured roots (`schemas/clean-backend/workstreams/*/SKILL.md:8-10`, `domain.examples.md:132,168`, `acceptance.examples.md:89`).
- `factory schemas` also lists each product with its folder and schema, and the plan skill picks the product and its schema from there.
- With products, archive consolidates decisions in `openspec/adr/<product>/<area>/<topic>.md`: a decision about one product does not govern another. Without products the path stays `openspec/adr/<area>/<topic>.md`.
- `clean-backend` keeps its name and its workstreams. The Clean Architecture pack under `shared` waits for a second schema that uses those workstreams (D1 and D4 of schemas-as-slices, `design.md:43,46`), which this change does not bring.
- Version 0.3.0 for the package and the command: a project's configuration gains a section, and a change's metadata gains two keys.

## Open questions

## Architecture decisions

### Decision: one-change-one-product · A change builds exactly one product

@adds @area:product @topic:products @applies:toolkit,schemas @enforced:validate,write-guard

In a project that declares products, every change SHALL name one declared product, its schema SHALL be that product's schema, and it SHALL open for writing only that product's folder. The changes of one intention SHALL name each other under `x-linked`.

**Why** A product is a deliverable, and the slice of a change goes end to end inside one deliverable. Tying the change to one folder lets the guard, the gate and the checks judge it without looking at the other products.

**Alternatives** A change spanning several products: the guard could no longer say which folder a change owns, and one product's failing checks would hold another product's change. The schema naming its folder: one published schema per layout.

**Consequences** An intention that touches back, front and shared code costs three changes, linked but not ordered. A refactor across products has to be split by product.

## Procedures

## Phases

### Phase 1: The project knows its products

**Tests**

The generated tests of the added requirement on products in `implementer` and of the modified requirement on configuration. A repository test resolves a configuration with `products` and one without, and checks that the second gives today's result.

- [x] Add `products` to the project configuration type, with `root`, `schema` and the product's own settings, and resolve each product's configuration in three layers with roots relative to its `root`
- [x] Replace the single-schema lookup (`toolkit/repository/schema.ts:167-189`) with the list of products, keeping one implicit product at the root when `products` is absent, and make its error for two architecture schemas say to declare `products`
- [x] Make `factory schemas` list each product with its folder and schema
- [x] Verify `pnpm run check` passes

### Phase 2: Every tool runs per product

**Tests**

The generated tests of the added requirements on per-product specs and checks. A repository test runs `factory check` on a fixture with two products where only one breaks a rule, and checks that only that product fails.

- [x] Turn the singletons of `toolkit/architecture/project.ts` into a function of the product, and make check, lint, rules, prepare, generate, test, review and the evidence digest run over one product or over each in turn
- [x] Prefix every zone pattern with the product's root, and give each product its own tsconfig and fallow configuration
- [x] Generate each product's acceptance tests from its own specs root into its own acceptance root
- [x] Rewrite the Owns lines, the scaffold destinations and the commands of the workstream skills and of the implement phase skill in terms of the product's roots, and keep the scaffold test passing
- [x] Verify `pnpm run check` passes

### Phase 3: A change belongs to one product

**Tests**

The generated tests of the added and modified requirements on `package/write-guard`, `package/completion-gate`, `flow/plan`, `flow/plan-validation` and `flow/archive`.

- [x] Read `x-product` and `x-linked` from a change's `.openspec.yaml`, and make validation report not ready a change that names no declared product, names a product of another schema, or links a change that does not link back
- [x] Make the write guard open a product path only to a change in implementation whose product holds it, and treat `.openspec.yaml` as one of the change's own artifacts
- [x] Make the gate, verify and implement judge a change by its own product's configuration, checks and rubric, and drop the hard-coded `app-domain` in `toolkit/flow/verify.ts:202`
- [x] Make archive consolidate decisions under `openspec/adr/<product>/` when the project declares products
- [x] Update the plan phase skill: pick the product and its schema from `factory schemas`, write `x-product` and `x-linked`, and replace the free-text link under Decisions
- [x] Verify `pnpm run check` passes

### Phase 4: A monorepo works end to end

**Tests**

A live session on a test project with `apps/api` and `apps/worker` on `clean-backend` and `packages/contracts` on `spec-plan`: one intention planned into linked changes, one of them built, the guard refusing a write to the other product, and the gate judging only the built product.

- [x] Build the package and install it into the test project with APM
- [x] Run the live session and record what it proved, and what it did not, under Feedback
- [x] Add the products section and the monorepo case to the README
- [x] Raise the package and command version to 0.3.0
- [x] Verify `pnpm run check` passes, `factory build backend --check` is fresh after a build, `factory proof` exits zero, and `factory verify products-per-folder` records the evidence

## Feedback

- Easel session on 2026-11-15 with the person: the five decisions marked "The person chose it on 2026-11-15" came from there. The rest were taken from the code and from OpenSpec 2.0.0's package, and the person approved the synthesis that listed them.
- Found while building (phase 2): generation and checks already followed the product once its configuration was resolved per product, so the per-product run is a loop in the command's entry, which runs each product in a process of its own (`FACTORY_PRODUCT`, or `--product`). No tool's code had to stop reading one configuration. The whole-product checks ignore the other products' folders, and a product's own `tsconfig.json` is used when it has one.
- Found while building (phase 3): an unproved scenario is raised on the workstream proved by acceptance tests, no longer on a hard-coded `app-domain`; for a schema without one, it is raised on the change itself.
- Phase 4 session on 2026-11-15, run by the agent with the real commands on a test project (APM 0.35.1, package 0.3.0, `apps/api` and `apps/worker` on `clean-backend`, `packages/contracts` on `spec-plan`). It was a scripted run, not an agent planning and building from a prompt. It proved the following:
  - `factory schemas` listed the three products.
  - Three linked changes validated ready. Breaking a link back and naming a product of another schema each made a change not ready, with the finding naming the fix.
  - `factory implement` on the api change prepared only `apps/api`.
  - The guard allowed `apps/api`, refused `apps/worker` and `packages/contracts` naming the product, and refused a generated test as harness.
  - The gate held the api change on its own pending acceptance test and did not mention a rule broken in `apps/worker`, which `factory check --product worker` reports.
- Found in that session: `factory implement` first generated the tests of its own product only, and the gate, which checks that every generated test is fresh, then held the change for the other products' ready changes. Now implement prepares only its product's roots and generates the tests of every product.
- Not proved there: an agent planning one intention into linked changes from a prompt (the plan skill's new step), `factory verify` and `factory archive` on that project. Both are covered by this repository's tests, not by a session.
- Verified on 2026-11-15 with 120 of 120 scenarios, `implementer` and `flow/plan` by the person's word. Why they had no generated test: in this repository a spec gets a generated test only when it has a step adapter (`toolkit/architecture/generated.ts:24-30`), and four specs have none: `implementer` (26 scenarios), `architecture/linting` (22), `flow/plan` (8) and `flow/implement` (4). verify-this-repository accepted that on 2026-11-14 by letting the person's word prove such a spec. The person wants every spec, being the documentation, to generate its acceptance tests; that is the next change.
- Found while closing: `factory archive --help` archives the change instead of printing help.

## Next step

Build it through the implement phase, then archive it with `factory archive`.
