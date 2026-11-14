# Evidence of bootstrap-clean-backend

What the live sessions of task groups 7 and 8 and of task 6.4 left, on 2026-11-14. The agent is Codex 0.166.0 (`codex exec`, sandbox `workspace-write`) except in the four `claude-*` transcripts, where it is Claude Code 2.1.322; the person's messages are the prompts at the top of each transcript.

## transcripts/

In the order they ran. The machine's own paths are written as `<scratch>` (the folder the scratch projects lived in) and `~`. The first eleven are one project, `shop`; `unsettled`, `question` and `feedback-person` are a second one.

| Transcript | What it shows |
| --- | --- |
| `plan-1.txt` | An intention of new behaviour becomes a change: plan, delta spec, one open question, not ready. Package 0.1.0. |
| `plan-2.txt` | The person's answer makes the plan ready. Then the gate, as it was, holds the agent and pushes it into building; inside the sandbox the command gets no output from its tools; an acceptance rule asks for a consolidated spec. Three failures in a row hand the change over. |
| `implement-1.txt` | Package 0.1.1. `factory implement` starts phase 1; one run builds it and leaves phase 2 alone; the gate lets it finish. |
| `implement-2.txt` | A second run builds phase 2. Every file is written through the shell, so no write reaches the write guard. |
| `verify-1.txt` | Package 0.1.2. Evidence: 3 of 3 scenarios, every check, review skipped; the procedure fails in `local` because the sandbox cannot write the pnpm store. Not verified; the person is asked. |
| `verify-2.txt` | The person says the procedure passes outside the sandbox. Verified. |
| `archive-1.txt` | Archived; every check passes. |
| `runbook-plan.txt` | An incident becomes a change with a plan and a procedure, no delta spec and no phase; ready at once. |
| `runbook-verify.txt` | No scenario; the procedure, tagged for `prod`, is reviewed only. Verified. |
| `runbook-archive.txt` | Archived; the procedure is consolidated by purpose. |
| `unsettled.txt` | On a plan that signs no seam for a fact the use case needs, the implement phase writes nothing and raises feedback; the feedback phase takes it in with an open question. |
| `question.txt` | A question that changes nothing opens no change. |
| `feedback-person.txt` | The person's answer is taken in: an entry under Feedback, the question removed, the change ready; the flow goes on into implementation. |

### The guards in Claude (task 6.4)

A third project, with package 0.1.2. Each file starts with the agent, the state of the project and the prompt, then every tool call, hook and answer in order.

| Transcript | What it shows |
| --- | --- |
| `claude-write.txt` | No change in implementation: a product write is refused by the write guard and the model quotes its reason. |
| `claude-harness.txt` | A write over an agent's skill is refused as harness; a product write is refused again. |
| `claude-finish.txt` | A change in implementation whose checks fail: the product write goes through, finishing is refused twice with the findings, and the third attempt is let through with the change waiting for the person. |
| `claude-helper.txt` | A helper agent is held twice and let through the third time; the main agent then finishes without a refusal. |

## shop/

The project the first eleven sessions worked in, as the last one left it: the product an agent built (`src`, `test`), and under `openspec` the consolidated spec, decision and procedures and the two archived changes with their plans and evidence.
