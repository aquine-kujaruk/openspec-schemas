---
name: verify
description: Verify a change. Writes the evidence that matches every scenario of the change to the test that proves it and runs every check, raising feedback instead of fixing. Use when a change has no unchecked task left.
---

# verify

Verifying judges and records. What fails becomes feedback; the product stays as it is.

1. `pnpm exec factory doctor`. When it prints anything as `missing` or `drift`, follow the `setup` skill first. A `note` is for the person: relay it once and go on. So is a `suspect`, a runbook that runs what the project no longer has: relay it once and go on; the `plan` skill investigates it.
2. For each procedure in the plan, read its `@env` tag. Where it is tagged `local` or `sandbox`, carry its steps out there and note whether its Verification holds. Any other environment is reviewed by reading only.
3. `pnpm exec factory verify <change>`, with one `--procedure <slug>@<environment>=passed` or `=failed` for each execution of step 2. It runs every check and every test, then what proves the workstreams work together (the whole-product checks and, for a web product, its end-to-end tests), matches each scenario to the test that proves it, runs the rubric review when the project configures its key, and writes `openspec/changes/<change>/evidence.md`.
4. Relay what it printed. `verified`: the `archive` skill is next. `not verified`: it raised feedback naming what failed; follow the `feedback` skill.
