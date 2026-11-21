---
name: implement
description: Implement a change. Builds every phase of a ready plan that still has unchecked tasks, in order, one task at a time, each inside the check of the workstream it names, then verifies the change. Use when the person asks to build, code or continue a planned change.
---

# implement

One run builds every phase of the plan that has an unchecked task, in the plan's order, then verifies the change. The phases are the order of the work in coherent blocks: each one is closed by its verification task before the next one starts, and the next one starts without asking the person. The run stops early only when feedback is raised, when a check keeps failing and you cannot make it pass, or when something only the person can give is missing (a key, approval to read `prod`): then tell the person exactly what it is.

Before editing, compare the receiving session’s bound workspace with the `Approved checkout` printed by handoff. If they differ, bind the session to that checkout in the launcher and resume there. Confirm the approved plan and project instructions there. In a consumer, check installed hooks with doctor. In the factory source repository, follow CONTRIBUTING.md.

1. `pnpm exec factory doctor`. When it prints anything as `missing` or `drift`, follow the `setup` skill first. A `note` is for the person: relay it once and go on. So is a `suspect`, a runbook that runs what the project no longer has: relay it once and go on; the `plan` skill investigates it.
2. `pnpm exec factory implement <change>`. It starts the phase only for a change validation reports ready, generates the acceptance tests of the change's delta specs, each next to its step adapter, and prints the tasks to do. When it prints `not ready`, tell the person what it found and stop. From here until the phase's checks pass, the completion gate holds the turn.
3. In a project with products, the change builds one product, the one its `.openspec.yaml` names as `x-product`: every path below sits in that product's folder and under its configured roots, and every `factory` command for it takes `--product <product>`.
4. Look at the tasks it printed. Tasks written `<workstream>: <task>` belong to a schema that builds product code: the roots are prepared, product code can now be written, and every step below applies. Tasks that name no workstream belong to a schema that builds none: product code stays closed to this change, so do the tasks in order, tick each one, let the phase's last task verify it the way the plan says, and skip steps 6 to 9.
5. A generated test is written only by `pnpm exec factory generate`: run it again whenever a delta spec changes, and treat a behaviour the tests lack as feedback on the change.
6. Write every seam the phase declares, signed exactly as the plan signs it, before the first task starts. When the examples beside the workstream skills hold `## scaffolds`, first render every scaffold whose destination names no `<module>` or `<name>` and does not exist yet (the shared bases), then start every seam whose kind has a scaffold from it, and only then sign it. A scaffold is the block whose info string is `ejs <destination>`; render it to its destination with:
   ```bash
   mkdir -p <folder of the destination> && pnpm dlx ejs@7.0.2 <(sed -n '\#^```ejs <destination as written>$#,/^```$/{//!p}' <examples file>) -o <destination> Name=<Name> name=<name> module=<module>
   ```
7. When the plan lists screens under Screens, the schema's spike workstream comes first: it builds each screen from its approved spike (`@spike`, a throwaway HTML page in the change) against stub controllers, and writes the end-to-end test of each journey the screen lists under `test/e2e/<module>/`, passing against the stubs. Those tests keep passing with `pnpm exec factory test e2e` as the real code takes the stubs' place, in later workstreams and in the later phase where the spike workstream replaces its own stubs; run them at the close of each phase that touches the screens. Take the phase's tasks in order. For each one, read `references/workstreams/<workstream>/SKILL.md` and the example files beside it, do the task inside that workstream's folders, run that workstream's check until it passes, and tick the task in the plan.
8. Keep the entry up to date. The entry (`src/main.ts` unless the schema or the project configures another) belongs to the workstream whose skill says it owns it: `modules` when no framework skill claims it, the framework's UI workstream otherwise. Where it is the composition root it builds each adapter, hands it to its repository implementation, and hands the repositories to the use cases; where the framework composes in its own files it mounts what the framework's skill says. Create it with the first use case or screen and extend it with every one after, so that every file of the product is reached from it or from a test.
9. The phase's last task verifies it: run the check of the workstream it names and tick it when it passes. Then run `pnpm exec factory implement <change>` again: it starts the next phase with unchecked tasks, and you go on from step 3 with the tasks it prints. When it prints that every task is done, follow the `verify` skill.

Decide alone what only the code needs: a private name, a helper, the order of the work. A decision a user would notice, a seam the plan does not sign, or a rule future changes would inherit is the plan's. When a task needs one the plan does not settle, stop the phase with the plan and the delta specs as they are, and raise it:

```bash
pnpm exec factory feedback <change> raise --from "the implement phase" --names "<workstream>: <task>" --says "<the decision that is missing>"
```

Follow the `feedback` skill. Route a reproduced reviewer defect through its repair procedure.

When you end a turn, the completion gate runs the checks of the phase being built and sends you back with what fails. Fix a reported failure and go on. When the gate names an unfinished phase, continue there. When it requests verification, run verify and check that the evidence is current.
