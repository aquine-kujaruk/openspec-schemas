---
name: react-hooks
description: Build the react-hooks workstream of the implementer: the framework layer without its JSX (controllers, queries, mutations, view-models, stores), replacing the stub controllers react-ui left, with the composition root in queries and mutations. Read from the implement skill.
---

# react-hooks

**Owns:** `src/<module>/framework/controllers/`, `queries/`, `mutations/`, `view-models/` and `stores/`.

**Paths:** every path here is written at the defaults. In a project with products, it sits in the folder of the change's product and under that product's configured roots (`pnpm exec factory schemas` lists each product's folder): `src` stands for the module root, and `src/main.tsx` for the configured entry. A scaffold's info string stays as written; only `mkdir -p` and `-o` take the product's path.

**Receives:** the use-case signatures of `app-domain` and the adapter instances `adapters` exports, both fixed in the change's artifacts; and from `react-ui` the stub controllers whose shape the pages destructure. Its seam with the core is the composition root: each query or mutation does `new XUseCase(new XRepositoryImplementation(xAdapter))` exactly once, and nothing else in the framework reaches the core.

**Fakes:** nothing. It replaces the body of each stub controller with queries, mutations, stores and view-models, keeping the shape the JSX reads; the project's type check fails when the shape drifts, and the fix is here, never in the page.

## How

1. Read the `## reference` of `framework.examples.md`: it is the shape of correct code. The other sections show each way of breaking a rule.
2. Start every query and every mutation from its scaffold, then fill it in; never write one from nothing. `<ref>` is the folder this skill is in; `<Name>`, `<name>` and `<camel>` are the use case's name in PascalCase, kebab-case and camelCase (`ListInvoices`, `list-invoices`, `listInvoices`), and `<Resource>`, `<resource>` and `<resourceCamel>` the name of the repository implementation and adapter it composes (`Invoice`, `invoice`, `invoice`); for a mutation, `<query>` and `<queryCamel>` name the query whose key it invalidates (`list-invoices`, `listInvoices`); the configured module root replaces `src`:
   ```bash
   # query
   mkdir -p src/<module>/framework/queries && pnpm dlx ejs@7.0.2 <(sed -n '\#^```ejs src/<module>/framework/queries/<name>.query.ts$#,/^```$/{//!p}' <ref>/framework.examples.md) -o src/<module>/framework/queries/<name>.query.ts Name=<Name> name=<name> camel=<camel> Resource=<Resource> resource=<resource> resourceCamel=<resourceCamel> module=<module>
   # mutation
   mkdir -p src/<module>/framework/mutations && pnpm dlx ejs@7.0.2 <(sed -n '\#^```ejs src/<module>/framework/mutations/<name>.mutation.ts$#,/^```$/{//!p}' <ref>/framework.examples.md) -o src/<module>/framework/mutations/<name>.mutation.ts Name=<Name> name=<name> camel=<camel> Resource=<Resource> resource=<resource> resourceCamel=<resourceCamel> query=<query> queryCamel=<queryCamel> module=<module>
   ```
3. Per use case: one query or mutation that bridges it (keys from a factory), then the view-models the screens need. A mutation invalidates, on success, every query whose data it changed, through the key factories those queries export; the screen then reads again what the server says.
4. Per URL page whose state changes (a filter, a step, a draft, a selection, a message): one store, `stores/<page>.store.ts` named after the page, that holds every such state of that page and nothing that came from a fetch or a mutation. Where the stub kept local state (`useState`, `useReducer`), the real controller reads the page's store instead; keep local state only where the store cannot hold it, and expect the review to ask why (S23).
5. Per stub controller: the real one. It imports domain, queries, mutations, stores, view-models and other controllers; never the JSX, never the query client, never a platform global. It exports no type.

**Declared skill:** `composition-patterns` (installed with the package, at the commit its manifest pins; never edit it), section 2 (state management: decouple the implementation, the context interface, lift state) for stores. The rest is about JSX and belongs to `react-ui`.

**End to end:** the plan left end-to-end tests under `test/e2e` passing against the stub controllers. Each real controller keeps them passing: in the environment `e2e` the adapters are the in-memory ones, seeded with the literal data the stub painted, so the same rows, totals and messages show. `pnpm exec factory test e2e` runs them.

**Check:** `pnpm exec factory check --workstream react-hooks [--module <module>]`, the project's type check and `pnpm exec factory test e2e`. `renderHook` tests over an in-memory adapter are a later decision.
