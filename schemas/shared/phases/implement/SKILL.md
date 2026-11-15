---
name: implement
description: Implement a change. Builds the first phase of a ready plan that still has unchecked tasks, one task at a time, each inside the check of the workstream it names. Use when the person asks to build, code or continue a planned change.
---

# implement

One run builds one phase: the first phase of the plan that has an unchecked task.

1. `pnpm exec factory doctor`. When it prints anything as `missing` or `drift`, follow the `setup` skill first. A `note` is for the person: relay it once and go on.
2. `pnpm exec factory implement <change>`. It starts the phase only for a change validation reports ready, generates the acceptance tests of the change's delta specs, each next to its step adapter, and prints the tasks to do. When it prints `not ready`, tell the person what it found and stop. From here until the phase's checks pass, the completion gate holds the turn.
3. In a project with products, the change builds one product, the one its `.openspec.yaml` names as `x-product`: every path below sits in that product's folder and under its configured roots, and every `factory` command for it takes `--product <product>`.
4. Look at the tasks it printed. Tasks written `<workstream>: <task>` belong to a schema that builds product code: the roots are prepared, product code can now be written, and every step below applies. Tasks that name no workstream belong to a schema that builds none: product code stays closed to this change, so do the tasks in order, tick each one, let the phase's last task verify it the way the plan says, and skip steps 6 to 9.
5. A generated test is written only by `pnpm exec factory generate`: run it again whenever a delta spec changes, and treat a behaviour the tests lack as feedback on the change.
6. Write every seam the phase declares, signed exactly as the plan signs it, before the first task starts. When the examples beside the workstream skills hold `## scaffolds`, first render every scaffold whose destination names no `<module>` or `<name>` and does not exist yet (the shared bases), then start every seam whose kind has a scaffold from it, and only then sign it. A scaffold is the block whose info string is `ejs <destination>`; render it to its destination with:
   ```bash
   mkdir -p <folder of the destination> && pnpm dlx ejs@7.0.2 <(sed -n '\#^```ejs <destination as written>$#,/^```$/{//!p}' <examples file>) -o <destination> Name=<Name> name=<name> module=<module>
   ```
7. Take the phase's tasks in order. For each one, read `references/workstreams/<workstream>/SKILL.md` and the example files beside it, do the task inside that workstream's folders, run that workstream's check until it passes, and tick the task in the plan.
8. Keep the entry up to date. The entry (`src/main.ts` unless the project configures another) belongs to `clean-architecture`: it builds each adapter, hands it to its repository implementation, and hands the repositories to the use cases. Create it with the first use case and extend it with every use case, repository and adapter, so that every file of the product is reached from it or from a test.
9. The phase's last task verifies it: run the check of the workstream it names, tick it when it passes, and stop. The next phase is another run.

Decide alone what only the code needs: a private name, a helper, the order of the work. A decision a user would notice, a seam the plan does not sign, or a rule future changes would inherit is the plan's. When a task needs one the plan does not settle, stop the phase with the plan and the delta specs as they are, and raise it:

```bash
pnpm exec factory feedback <change> raise --from "the implement phase" --names "<workstream>: <task>" --says "<the decision that is missing>"
```

Then tell the person and follow the `feedback` skill.

When you finish, the completion gate runs the phase's checks and sends you back with what fails. Fix that; the gate is satisfied by passing checks, and its pass ends the run: the next phase starts with step 2 again.
