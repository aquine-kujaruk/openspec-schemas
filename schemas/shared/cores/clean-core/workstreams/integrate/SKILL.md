---
name: integrate
description: Run the integrate reduce workstream of the implementer: join the workstreams under it into the whole product and pass dead code and duplication. Read from the implement skill.
---

# integrate

**Reduces:** the workstreams the topology lists under it (by default `modules`).

**Owns:** the checks that only make sense once everything is wired:

- `no-unused-files`: no file of the product is left unused. Everything is reached from the entry or from a test; the HTTP and in-memory adapters are both reachable because `x.adapter.ts` picks one by environment.
- `duplication-below-threshold`: global duplication under 4 %. A block repeated in two modules is a candidate for `shared`. The generated acceptance tests are skipped: they repeat by design.

## How

1. Merge the upstream work; the entry is where the use cases, the repositories and the adapters meet.
2. Run the check. It is the full pipeline: every workstream's rules, these two checks and the freshness of the generated tests. End-to-end tests will live here once `test/e2e` has them.

**Check:** `pnpm exec factory check --workstream integrate`; `pnpm exec factory check` adds the freshness of the generated tests.
