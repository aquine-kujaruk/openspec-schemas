---
name: adapters
description: Build the adapters workstream of the implementer: the resource adapters behind each anti-corruption layer, the only place where the environment lives. Read from the implement skill.
---

# adapters

**Owns:** `src/<module>/infrastructure/adapters/` and `src/shared/infrastructure/adapters/` (the base adapters every module composes, such as `http-api.adapter.ts`).

**Paths:** every path here is written at the defaults. In a project with products, it sits in the folder of the change's product and under that product's configured roots (`pnpm exec factory schemas` lists each product's folder): `src` stands for the module root, `test/acceptance` and `test/integration` for the acceptance and integration roots, and `openspec/specs/<module>` for `openspec/specs/<product>/<module>`. A scaffold's info string stays as written; only `mkdir -p` and `-o` take the product's path.

**Receives:** the ACLs of `infrastructure` (`acl/<name>.acl.ts`: `interface <Name>Acl` and the schemas of its records), fixed before this workstream starts, and the domain exceptions an adapter throws. The ACL is the seam: a repository implementation receives an adapter typed by it and never imports or constructs one, so this workstream and `infrastructure` are built apart.

**Fakes:** nothing. Adapters are the edge; behind them is the real resource.

## How

1. Read the `## reference` of `adapters.examples.md`. The shared base `http-api.adapter.ts` already exists: the seam step renders it from its scaffold when it is missing.
2. Per ACL: one adapter per backend (`http-<name>.adapter.ts`, `in-memory-<name>.adapter.ts`), each a class that `implements <Name>Acl`, and `<name>.adapter.ts`, which picks one by environment and exports the ACL-typed instance (`export const <name>Adapter: <Name>Acl`). Every ACL needs at least one adapter.
3. Speak the resource's shape: parse through the ACL's record schemas, never a domain schema. Translate the resource's failures into domain exceptions with the caught error as `cause`.

No product tests for now: the rules are the check. Contract tests against the real services (testcontainers or similar) are a later decision; when they come, they belong here.

**Check:** `pnpm exec factory check --workstream adapters [--module <module>]`.
