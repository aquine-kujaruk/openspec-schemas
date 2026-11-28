---
name: doctor-reports-changed-rules
description: After a factory update, factory doctor names the rules that changed since the project last passed its check and which of them the project's code now breaks, so the agent opens a change to adapt the code.
created_at: 2026-11-28
created_by: Edgar
approved_at: 2026-11-28
schema: spec-plan
---

# Doctor reports the rules that changed with an update

## Goal

A project that updates its package learns from `factory doctor` which rules of its schemas were added or changed since the version it last conformed to, and which of those its code now breaks, file by file. The report tells the agent to adapt the code through a change before planning anything else, and it stops once the project's check passes under the new rules. This change goes first so that the four changes after it, which add rules, reach every project that already uses the factory this way.

## Findings

- `factory doctor` reports `missing`, `drift` (skills and command at different versions), `repaired`, `note` and `suspect`; nothing about rules (`factory/maintenance.ts`, `openspec/specs/factory/maintenance/maintain-equipment/spec.md`, seen 2026-11-28).
- A built package carries `setup/assets/manifest.json` with its package, version, command, agents, schemas and phases, and no list of rules (`dist/fullstack/.apm/skills/setup/assets/manifest.json`, seen 2026-11-28).
- Each rule has a stable id and its cases in `<layer>.examples.md` (deterministic rules) or a row in `review/RUBRIC.md` (rubric rows); the build already copies `*.examples.md` into the package (`tools/build.ts:273`, seen 2026-11-28).
- `docs/upgrading.md` stops at 0.3 → 0.4; upgrades since then are announced nowhere (seen 2026-11-28).
- `.factory-review.json` already records, per file, what the review last judged: the precedent for a record the factory writes in the project root (seen 2026-11-28).
- In `mau` (`fullstack` 0.15.0) the rules of 0.16.0 (`class-name-carries-role`, `schema-validates-at-runtime`, `value-object-holds-several-values`) and 0.17.0 (`code-breathes`) would surface only as a red `factory check`, with no word that the update caused them (inference from the release history, 2026-11-28).

## Decisions

- The package carries a rules ledger in its manifest: each deterministic rule and rubric row by id, with a hash of its definition (title, or question and layers) and of its cases. Discarded: a hand-written changelog, which drifts from the rules. @by:agent
- The project records the ledger it conforms to in `.factory-rules.json` at its root, written by `factory check` when it passes. Discarded: writing it at install, which would record rules the code never passed. @by:agent
- Doctor compares the installed ledger with the record and reports `outdated` for each added or changed rule the project now breaks, with the files, and as a `note` each one it passes or each removed rule. `outdated` sets status 1, like `drift`; `--fix` never repairs it, because only a change to the code can. @by:agent
- A project with no record (installed before this change) is judged against every rule once: doctor runs the check and reports what breaks, and the first passing check writes the record. @by:agent
- Rubric rows are reported as changed but not run by doctor: a model call belongs to `factory review`. @by:agent
- The `plan` skill turns an `outdated` report into a change of the product's schema named `adapt-to-rules-<version>`, offered to the person before their own intention. @by:person
- An `outdated` report is offered to the person first and does not block a new plan; it repeats every time doctor runs. @by:person
- Work order: this change, then `use-cases-hydrate-through-the-domain`, `use-cases-branch-only-on-io`, `adapters-wrap-external-systems` and `factory-cli-through-controllers`. @by:agent

## Open questions

## Architecture decisions

### Decision: rules-ledger-travels-with-package · A package names its rules and a project records the ones it passed

@adds @area:product @topic:packaging @applies:factory,tools,packages @enforced:maintain-equipment-acceptance @by:person

A built package SHALL carry the ledger of its rules, each id with the hash of its definition and its cases, and a project SHALL record the ledger it last passed. Setup SHALL report every added or changed rule the project breaks as `outdated`, until the project's check passes again.

**Why** An update that adds a rule otherwise reaches a project as an unexplained red check, and the agent cannot tell an old debt from a new standard.

**Alternatives** A changelog in `docs/upgrading.md`: written by hand, it says nothing about this project's code.

**Consequences** Every rule change reaches every project as a named list to adapt; the record is one more file the factory writes in the project.

## Procedures

## Screens

## Phases

### Phase 1: The package carries its rules ledger

**Seams**

```ts
// factory/engineering (or quality): one ledger per schema set
export type RulesLedger = Record<string, string>; // rule id → hash of definition and cases
// setup/assets/manifest.json gains `rules: RulesLedger`
// .factory-rules.json in the project: { version: string; rules: RulesLedger }
```

**Tests**

- A build test: the manifest lists every rule id of the packaged schemas, and changing a case changes only that rule's hash.

- [ ] Compute the ledger from the rules and rubric rows of the packaged schemas and write it into the manifest at build
- [ ] Make `factory check` write `.factory-rules.json` when it passes
- [ ] Verify the phase: `pnpm run check`

### Phase 2: Doctor reports the outdated rules

**Seams**

```ts
// factory/maintenance/domain/schemas/maintenance-item.schema.ts
MaintenanceKind.Outdated // "outdated: <rule> — <n> file(s): <paths>"
```

**Tests**

- The acceptance tests generated from the delta spec of `maintain-equipment`.

- [ ] Compare the installed ledger with the project's record and run the added or changed deterministic rules
- [ ] Report `outdated` items and notes, and make `outdated` set status 1
- [ ] Teach the `setup` and `plan` skills to offer `adapt-to-rules-<version>` on an `outdated` report, and document it in `docs/upgrading.md`
- [ ] Verify the phase: `pnpm run check`

## Feedback

## Next step
