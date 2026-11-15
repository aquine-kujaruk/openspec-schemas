---
name: infrastructure
description: Build the infrastructure workstream of the implementer: repository implementations, anti-corruption layers and paginators, and one integration test per repository implementation over an in-memory adapter typed by the real ACL. Read from the implement skill.
---

# infrastructure

**Owns:** `src/<module>/infrastructure/` except `adapters`: `repository-implementations`, `acl`, and the emergent folders the configuration admits, such as `paginators`; and `test/integration/<module>/` (one `<x>-repository.test.ts` per repository implementation). The adapters are the `adapters` workstream.

**Receives:** the repository interfaces of `app-domain` (it implements them exactly) and the domain props and exceptions they name. The ACLs it declares are seams that `adapters` implements. The change's design fixes both, with the record → props mapping one line per field and the domain exception for each failure of the resource.

**Fakes:** the adapter, and only it. The ACL is real: its interface and its record schemas (the schema package) say which attributes the system needs and validate them. The integration test builds `new XRepositoryImplementation(new InMemoryXAdapter(records))`, where the in-memory adapter implements that ACL: the product's `in-memory-<x>.adapter.ts` once `adapters` has built it, or a class inside the test until then. Without the real adapter, repositories and ACLs are pure code: map records to props, raise domain exceptions. A repository or adapter throws only the exceptions of its own module (or `ValidationException`), with the resource's error in `cause`; a shared adapter such as `HttpApiAdapter` receives from the module adapter the exception to throw.

## How

1. Read the `## reference` of `infrastructure.examples.md` and `integration.examples.md`.
2. Per resource: the ACL (record schema and interface) is already fixed, started from its scaffold at the seam step; write the repository implementation over it. A repository never imports an adapter or does `new XAdapter(`: the composition root injects it.
3. Per repository implementation, write `test/integration/<module>/<x>-repository.test.ts`: the mapping of every field the design names and the exception for every failure. Invent the records inside the ACL's schema, taking the Examples of the product specs as a guide where values overlap; no fixture comes from the artifacts. When the behavior changes, rewrite the test inside the same seams.

**Check:** `pnpm exec factory check --workstream infrastructure [--module <module>]`, plus `pnpm exec factory test integration`.
