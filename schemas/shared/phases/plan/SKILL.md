---
name: plan
description: Plan a change. Turns an intention that would change the product's behaviour, its code, a standing decision or a procedure into a change whose plan and delta specs validation reports ready. Use when the person states such an intention.
---

# plan

The artifacts are the handoff: everything decided ends up in the plan or in a delta spec.

1. `pnpm exec factory doctor`. When it prints anything as `missing` or `drift`, follow the `setup` skill first. A `note` is for the person: relay it once and go on.
2. Decide whether the intention changes anything: behaviour, code, a standing decision or a procedure. A question about the system changes nothing: answer it and stop here. An intention about a change that is already open belongs to the `feedback` skill.
3. Choose the schema. `pnpm exec factory schemas` lists the schemas this project has, when each one is used and the workstreams it builds through, and the products it declares, each with its folder and its schema. Pick the one whose use covers the intention. When the intention needs two of them, open one change per schema. In a project with products, open one change per product the intention touches, each made with that product's schema. When no schema covers the intention, open no change: tell the person which schemas the project has and stop.
4. Open the change: `pnpm exec factory openspec new change <name> --schema <schema>`, the name a short kebab-case phrase of what changes. Then add to its `openspec/changes/<name>/.openspec.yaml`, below what the tool wrote:
   - in a project with products, the product it builds: `x-product: <product>`;
   - when the intention opened more than one change, the others: `x-linked: [<change>, <change>]`, in every one of them, so that each lists all the others.
   Validation reports a change not ready while its product is missing or of another schema, or while a link does not go both ways.
5. Read what stands: the specs under `openspec/specs` the intention touches, and everything under `openspec/adr` and `openspec/runbooks`. In a project with products, a product's specs are under `openspec/specs/<product>/` and its decisions under `openspec/adr/<product>/`, and a delta spec of its change sits at `specs/<product>/<module>/<use-case>/spec.md`.
6. Probe every access the change will use, so that once the person approves the plan the implementation needs nothing more from them: an API behind an adapter, the repository, what is deployed, the logs, the state of production. Skip an access that a linked change builds; it does not exist yet. For each one:
   - Reuse the access procedure `openspec/runbooks` holds for it, or write one in the plan: how to reach it, where each secret is kept, and, under `@keys`, the environment variables it reads.
   - Run the minimum that shows the implementation will work: the key is there and one authenticated read call answers. Read the secret from where it is kept and never print it. Call `local` and `sandbox` freely; call `prod` only after the person approves that one read, as an open question.
   - Run it under your real permissions. When you plan in an auto or bypass permission mode, do not check permissions unless the person asks.
   - When it answers, tag the procedure `@probed:<YYYY-MM-DD>`, and write what you saw under Findings, with its source and the date. A standing procedure is modified only when something changed.
   - When something is missing (a key, the way to authenticate, a permission, approval to call `prod`), list it as an open question that says exactly what the person adds and where. The person may decline it: then tag the procedure `@probed:declined`, say so under Decisions, and go on. The implementation will fail on that access, and that part is left undone if it is never configured.
7. When the schema has workstreams, read the skill of each one the change will touch, under the `implement` skill's `references/workstreams/<workstream>/SKILL.md`. Its Owns line says where that workstream's files live and how they are named: a seam is signed in those folders and with those names.
8. `pnpm exec factory openspec status --change <name> --json` lists the artifacts of the change's schema. For each one, `pnpm exec factory openspec instructions <artifact> --change <name> --json` gives its instruction and its template: write the artifact as that instruction says. Write the whole first proposal from your own decisions before asking the person anything. The plan's instruction says which decisions are the person's; those go under Open questions, each with the option you picked.
9. `pnpm exec factory validate <name>` and fix every finding that is yours to fix.
10. Show the person the open questions. When they answer, record each answered decision in its artifact and remove its question in that same update, then validate again.

The plan is done when `pnpm exec factory validate <name>` prints `ready`. Tell the person and stop: building it is the `implement` skill, in a run the person starts.
