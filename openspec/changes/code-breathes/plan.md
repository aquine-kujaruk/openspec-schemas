---
name: code-breathes
description: A clean-core rule makes code breathe (blank lines between blocks, always before a return) and the review rubric treats a comment as the exception, kept only as a seed the next agent could not deduce.
created_at: 2026-11-28
created_by: Edgar
approved_at: 2026-11-28
schema: spec-plan
---

# Code breathes and comments are the exception

## Goal

Source code of every product built with the clean core, and of this repository's factory, separates its logical blocks with a blank line and carries almost no comments. `factory check` fails a statement that is glued to a multi-line neighbour or to a `return`; `factory review` warns about any comment that is not a seed for the next agent, judged by the decision model.

## Findings

- A scan with the TypeScript compiler over `factory/**/*.ts` finds 1137 glued statements in 132 of 243 files: 1010 next to a multi-line statement and 127 before a `return` or `throw` (throwaway script, seen 2026-11-28).
- `factory/` holds 702 lines of comments (`grep -rcE "^\s*(//|/\*|\*)"`, seen 2026-11-28).
- The rubric already has S20 (`local-comments`): a comment that restates the code or narrates a requirement, a decision or a contract. It is a review warning and never fails `factory check` (`schemas/shared/cores/clean-core/review/RUBRIC.md`, seen 2026-11-28).
- The whole-core rules live in `schemas/shared/cores/clean-core/workstreams/modules/modules.rules.ts` and are tested through `modules.examples.md`; `typescript` is a dependency of the factory, not of a product, so a rule reads code through a helper exported from `factory/sdk` (`package.json`, seen 2026-11-28).
- The two example edits the person made by hand (`change-control.ts`, `write-request.schema.ts`) were reverted by the person before this plan.

## Decisions

- Blocks are separated by one deterministic rule and one rubric row: the rule judges what a parser sees (a multi-line statement is a block of its own, a `return` or `throw` is always apart), the row judges what only a reader sees (a command that is created and then executed, an enrichment, a different step). Discarded: a single review row, which could not fail `factory check`. @by:agent
- A run of single-line statements stays glued: simple declarations and imports group freely. @by:person
- The rule scans every file under the product's source root, tests excluded. Discarded: touched files only, which the check cannot know. @by:agent
- Comments stay a review warning, never a failing check, with S20 rewritten: a comment is judged against "could the next agent deduce this from the code and the artifacts?", and a seed for the next agent is the only yes. Directives that switch a rule off remain refused by `no-harness-escapes`. Discarded: a deterministic ban, because the person wants judgement on the exception. @by:person
- The decision model judges the comments (S20) and the semantic blocks (S24), as the person asked. @by:person
- The existing blank lines are added to the factory by a one-off script that applies the rule's own scan, so the rule passes in this repository. @by:agent
- Sweep existing comments across factory source in this change and retain only context that cannot be inferred from code and artifacts. @by:person
- The version goes to 0.17.0: a product that glues its statements fails `factory check` after updating. @by:agent
- The change is delivered as a pull request left open for the person's review; on the person's go it is merged and the change archived. @by:person

## Open questions

## Architecture decisions

### Decision: code-breathes · Blocks are separated; a comment is the exception

@adds @area:product @topic:clean-core @applies:schemas,factory @enforced:code-breathes @by:person

A statement SHALL be separated by a blank line from the statement before it when either spans several lines or when it is a `return` or `throw` that is not alone in its block; single-line declarations and imports MAY stay together. A comment SHALL stay only when it is a seed the next agent could not deduce from the code and the artifacts.

**Why** Code that breathes reads in blocks, and a comment is a second copy of what the code says that the next change has to keep in step.

**Alternatives** A formatter setting: no formatter knows a logical block. A deterministic ban on comments: it cannot spare the seed.

**Consequences** A product with a glued statement fails `factory check`; a comment that is not a seed shows as a review warning.

## Procedures

## Screens

## Phases

### Phase 1: The clean core refuses glued blocks

**Seams**

```ts
// factory/quality/domain/services/architecture-standards.service.ts, exported from factory/sdk
export const glued = (content: string): number[]; // 1-based lines of the statements that must be apart
// schemas/shared/cores/clean-core/workstreams/modules/modules.rules.ts
id: "code-breathes" // no file under the source root holds a glued statement
```

**Tests**

- The maintained suite for `architecture/modules`: each new case of `modules.examples.md` breaks `code-breathes` in the files its `expect` block records, and the reference breaks nothing.
- A unit test of `glued` over statements, imports, a `return`, a `case` and a nested block.

- [x] Write `glued` over the TypeScript syntax tree and export it from `factory/sdk`, with its unit test
- [x] Write the rule `code-breathes` in `modules.rules.ts`
- [x] Add one case per way of breaking it to `modules.examples.md`, record each `expect` block with `pnpm exec factory expect modules` and generate the tests with `pnpm exec factory generate`
- [x] Verify the phase: `pnpm run check` apart from the repository's own files, which phase 2 fixes

### Phase 2: The factory breathes and the rubric asks for fewer comments

**Seams**

```md
S20 · local-comments: rewritten to ask whether a comment is more than a seed for the next agent
S24 · code-blocks: asks whether unrelated steps share a block of statements
```

**Tests**

- The rubric cases of `domain.examples.md` for S20 keep `yes` for the restating comment and `no` for the reference; S24 has one case of each.
- `pnpm run check` passes in this repository.

- [x] Insert the missing blank lines in `factory/` with a one-off script that applies `glued`, and run the repository's tests
- [x] Sweep existing factory source comments under the S20 criterion
- [x] Rewrite S20 and add S24 to `RUBRIC.md`, with their cases and scores
- [x] Name the rule and the two rows in the `modules` and `app-domain` skills, and raise `package.json` to 0.17.0
- [x] Verify the phase: `pnpm run check`

## Feedback

- **the person**: Sweep the existing factory source comments in this change and keep only comments that carry information a future agent cannot infer.

## Next step
