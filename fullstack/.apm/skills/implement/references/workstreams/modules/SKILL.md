---
name: modules
description: Run the modules reduce workstream of the implementer: merge app-domain, infrastructure and adapters, resolve conflicts at their seams and pass the cross-module rules. Read from the implement skill.
---

# modules

**Reduces:** the workstreams the topology lists under it (by default `app-domain`, `infrastructure` and `adapters`).

**Owns:** the cross-module rules (`modules.rules.ts`): modules do not import one another, `shared` imports no module, no cycles, every file in a zone, no tests in `src`, no `any` and no raw errors in the core, and no escape from the harness (a lint rule disabled, a type error suppressed or expected, a cast through `unknown`). It also owns the entry (`src/main.ts` by default), the composition root: the only place that builds adapters, repositories and use cases together, unless the schema's framework claims the entry in its own skill (in `clean-react`, `react` writes it and its queries and mutations compose).

**Paths:** every path here is written at the defaults. In a project with products, it sits in the folder of the change's product and under that product's configured roots (`pnpm exec factory schemas` lists each product's folder): `src` stands for the module root, `test/acceptance` and `test/integration` for the acceptance and integration roots, and `openspec/specs/<module>` for `openspec/specs/<product>/<module>`. A scaffold's info string stays as written; only `mkdir -p` and `-o` take the product's path.

## How

1. Merge the upstream workstreams' work. A conflict can only be at a seam: if both sides changed a repository interface or an ACL, the seam was not fixed first; settle it on what the consumer needs (the use case for a repository interface, the repository implementation for an ACL) and adapt the other side.
2. Run the check. This is where it shows whether each map workstream built what its spec, its skill and its seams asked for. A failure names the workstream: go back to it and fix it there, keeping the seams and the artifacts as they are, then run this check again. A decision the artifacts do not settle and you cannot take goes to the person, as the implement skill says.
3. Fix what crosses modules: move what two modules share into `shared`, break cycles.

**Check:** `pnpm exec factory check --workstream modules [--module <module>]`, which includes every upstream workstream's check.

No file left unused and duplication under 4 % are checked over the whole product by `pnpm exec factory check` and by the verify phase, not here: halfway through a change some code is not wired yet. When verify sends one back naming a file of this workstream, fix it here.
