---
name: plan
description: Plan a change. Turns an intention that would change the product's behaviour, its code, a standing decision or a procedure into a change whose plan and delta specs validation reports ready. Use when the person states such an intention.
---

# plan

The artifacts are the handoff: everything decided ends up in the plan or in a delta spec.

1. `pnpm exec factory doctor`. When it prints anything as `missing` or `drift`, follow the `setup` skill first. A `note` is for the person: relay it once and go on.
2. Decide whether the intention changes anything: behaviour, code, a standing decision or a procedure. A question about the system changes nothing: answer it and stop here. An intention about a change that is already open belongs to the `feedback` skill.
3. Choose the schema. `pnpm exec factory schemas` lists the schemas this project has, when each one is used and the workstreams it builds through. Pick the one whose use covers the intention. When the intention needs two of them, open one change per schema, and write under Decisions of each plan the name of the other change and what it leaves to it. When no schema covers the intention, open no change: tell the person which schemas the project has and stop.
4. Open the change: `pnpm exec factory openspec new change <name> --schema <schema>`, the name a short kebab-case phrase of what changes.
5. Read what stands: the specs under `openspec/specs` the intention touches, and everything under `openspec/adr` and `openspec/runbooks`.
6. When the schema has workstreams, read the skill of each one the change will touch, under the `implement` skill's `references/workstreams/<workstream>/SKILL.md`. Its Owns line says where that workstream's files live and how they are named: a seam is signed in those folders and with those names.
7. `pnpm exec factory openspec status --change <name> --json` lists the artifacts of the change's schema. For each one, `pnpm exec factory openspec instructions <artifact> --change <name> --json` gives its instruction and its template: write the artifact as that instruction says. Write the whole first proposal from your own decisions before asking the person anything. The plan's instruction says which decisions are the person's; those go under Open questions, each with the option you picked.
8. `pnpm exec factory validate <name>` and fix every finding that is yours to fix.
9. Show the person the open questions. When they answer, record each answered decision in its artifact and remove its question in that same update, then validate again.

The plan is done when `pnpm exec factory validate <name>` prints `ready`. Tell the person and stop: building it is the `implement` skill, in a run the person starts.
