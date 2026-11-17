---
name: feedback
description: Take feedback into a change. Updates the plan, and the delta specs when behaviour is affected, of the change the feedback is about, reopening only the phases it invalidates. Use when the person corrects an open change, or when a guard, the verify phase or the archive sends a change back.
---

# feedback

Feedback goes back into the change it is about, whoever raised it: `the person`, `the completion gate`, `the verify phase`, `the archive` or `the implement phase`.

1. `pnpm exec factory doctor`. When it prints anything as `missing` or `drift`, follow the `setup` skill first. A `note` is for the person: relay it once and go on. So is a `suspect`, a runbook that runs what the project no longer has: relay it once and go on; the `plan` skill investigates it.
2. `pnpm exec factory feedback <change>` lists what was raised and is waiting. What the person just said is feedback from `the person`.
3. For each piece of feedback, settle two things:
   - the earliest phase whose work it undoes, or none when it only adds to what is left;
   - the decisions it needs that only the person can take, by the question policy in the plan's instruction (`pnpm exec factory openspec instructions plan --change <change> --json`). Something neither the plan nor you can settle, such as a defect of the harness or an access you lack, is a question for the person too.
4. Take it in:

   ```bash
   pnpm exec factory feedback <change> take --from "<source>" --says "<what it said and what changes>" --phase <n> --ask "<question>"
   ```

   Leave `--phase` out when no phase is undone, and give one `--ask` per question. The command adds the entry under Feedback, unchecks the tasks of phase `<n>` and of every phase after it, and lists each question under Open questions.
5. Update what the feedback changes: the plan's decisions, seams and tasks, and the delta specs when behaviour is affected. Everything goes into this change.
6. `pnpm exec factory validate <change>`. With open questions the change waits for the person: show them and stop. Once it prints `ready`, the `implement` skill goes on from the first phase with unchecked tasks.
