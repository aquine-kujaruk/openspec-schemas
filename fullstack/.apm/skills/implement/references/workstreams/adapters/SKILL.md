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
2. Per ACL: one adapter per backend (`http-<name>.adapter.ts`, `in-memory-<name>.adapter.ts`), each a class that `implements <Name>Acl`, and `<name>.adapter.ts`, which picks one by environment and exports the ACL-typed instance (`export const <name>Adapter: <Name>Acl`). Every ACL needs at least one adapter. In a web product, the environment `e2e` picks the in-memory adapter, seeded with the literal data the approved spike painted, so that the end-to-end tests under `test/e2e` see what the person approved.
3. Speak the resource's shape: parse through the ACL's record schemas, never a domain schema. Translate the resource's failures into domain exceptions with the caught error as `cause`.

Choose the external system each adapter wraps (filesystem, process, database or remote service). Expose it through its ACL and name the class for its adapter role (`acl-adapter-paired`, `infrastructure-names-the-role`). Keep helpers local until an actual consumer needs them. When several modules use the same infrastructure object, apply S14 before moving it to shared infrastructure.

No product tests for now: the rules are the check. Contract tests against the real services (testcontainers or similar) are a later decision; when they come, they belong here.

**Check:** `pnpm exec factory check --workstream adapters [--module <module>]`.
