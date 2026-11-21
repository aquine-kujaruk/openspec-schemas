---
name: react
description: Build the react workstream of the implementer: the React framework, both its JSX (pages and components in framework/ui, the bridges and the entry) and the layer without it (controllers, queries, mutations, view-models, stores). It builds the screens against a stub controller per page first, and later replaces each stub with the real controller over the core's seams. Read from the implement skill.
---

# react

**Owns:** `src/<module>/framework/ui/` (pages and components, `.tsx` only), `src/<module>/framework/bridges/` and the entry (`src/main.tsx`: providers, bridges and routing); and `src/<module>/framework/controllers/`, `queries/`, `mutations/`, `view-models/` and `stores/`. Navigation lives in `ui`, the bridges and the entry: they may read and change the location, and they neither persist nor talk to the network.

**Paths:** every path here is written at the defaults. In a project with products, it sits in the folder of the change's product and under that product's configured roots (`pnpm exec factory schemas` lists each product's folder): `src` stands for the module root, and `src/main.tsx` for the configured entry. A scaffold's info string stays as written; only `mkdir -p` and `-o` take the product's path.

**Receives:** first, the screens of the change, each with its approved spike (`@spike`, a throwaway HTML page under `openspec/changes/<change>/spikes/`) and its journeys in plain words, and the domain entities and value objects they paint. Later, in the phase that replaces the stubs, the use-case signatures of `app-domain` and the adapter instances `adapters` exports, signed as seams of that phase before any workstream starts. What a page needs from its controller is not a seam: it is discovered by writing the page, and it stays inside this workstream.

**Fakes:** the controller, and only until the phase that replaces it. Its seam with the core is the composition root: each query or mutation does `new XUseCase(new XRepositoryImplementation(xAdapter))` exactly once, and nothing else in the framework reaches the core.

The work comes in two parts, in the phases the plan gives them. Take the plan's tasks in order: in the phase that replaces the stubs, this workstream's task comes after the core's.

## Screens, against stubs

Each page destructures one hook, `use<Name>Controller` from `framework/controllers/<name>.controller.ts`. Until its real body is written, it is a stub that returns literal data and imports nothing but React:

```ts
export const useOrdersListController = () => ({
  rows: [{ id: "O-1", placedOn: "2026-01-05", status: "Pending", total: "25.98 EUR" }],
  isEmpty: false,
  onNext: () => {},
});
```

When the screen offers an action that writes (pay, cancel, save), the stub keeps its literal data in local state and the action changes it, so that the journey's end-to-end test sees the result against the stubs. It is the minimum that passes the test: no store, no query cache, nothing else. Its body is replaced later by the mutation and the page's store:

```ts
import { useState } from "react";
export const useInvoiceDetailController = () => {
  const [status, setStatus] = useState("Pending");
  return { status, canPay: status === "Pending", onPay: () => setStatus("Paid") };
};
```

The page infers its props from the stub (`ReturnType<typeof useX>` when a component needs the type); the controller exports no type. A page reaches the core only through its controller: never a query, a store or the query client.

1. Read the `## reference` of `ui.examples.md`: it is the shape of correct code. The other sections show each way of breaking a rule.
2. Start every page and every stub controller from its scaffold, then fill it in; never write one of them from nothing. `<ref>` is the folder this skill is in, `<Name>` and `<name>` the screen's name in PascalCase and kebab-case, and the configured module root replaces `src`:
   ```bash
   # stub controller (its body is replaced later, keeping its shape)
   mkdir -p src/<module>/framework/controllers && pnpm dlx ejs@7.0.2 <(sed -n '\#^```ejs src/<module>/framework/controllers/<name>.controller.ts$#,/^```$/{//!p}' <ref>/ui.examples.md) -o src/<module>/framework/controllers/<name>.controller.ts Name=<Name> name=<name> module=<module>
   # page
   mkdir -p src/<module>/framework/ui/<name> && pnpm dlx ejs@7.0.2 <(sed -n '\#^```ejs src/<module>/framework/ui/<name>/<name>.page.tsx$#,/^```$/{//!p}' <ref>/ui.examples.md) -o src/<module>/framework/ui/<name>/<name>.page.tsx Name=<Name> name=<name> module=<module>
   ```
3. Per screen, open its spike and build what it shows: the page, its components, its stub controller with the literal data the spike paints. The spike is a mockup: take its layout, controls, states, texts and data, and write the markup and styles the way the reference and the product write them. The JSX neither compares nor counts: the controller exposes `isEmpty`, `isSelected`, `count`.
4. Routing and anything that must read the location go in a bridge (`x.bridge.tsx`), which the entry mounts.
5. Mount the app with the product's `local-run` procedure and look at each screen against its spike.
6. Per journey the screen lists, write its end-to-end test under `test/e2e/<module>/<journey>.e2e.ts`: the actions as `agent.act` in natural language, taken from the journey's steps, and the checks as locators and `expect` on what the page shows, never `agent.waitFor` or `agent.extract`. The first web change of a product also writes `e2e.config.ts` at the product's root: the target's `app.command` and `app.url` from the `local-run` procedure, and the agent you are as executor (`claudeCode()` or `codex()` of `@e2e-dev/acp`). Run `pnpm exec factory test e2e` until they pass against the stubs, and commit `.e2e/cache` with them.

## Controllers, over the core

The body of each stub is replaced by queries, mutations, stores and view-models, keeping the shape the JSX reads. The project's type check fails when the shape drifts, and the fix is in the controller, never in the page.

1. Read the `## reference` of `framework.examples.md`: it is the shape of correct code. The other sections show each way of breaking a rule.
2. Start every query and every mutation from its scaffold, then fill it in; never write one from nothing. `<Name>`, `<name>` and `<camel>` are the use case's name in PascalCase, kebab-case and camelCase (`ListInvoices`, `list-invoices`, `listInvoices`), and `<Resource>`, `<resource>` and `<resourceCamel>` the name of the repository implementation and adapter it composes (`Invoice`, `invoice`, `invoice`); for a mutation, `<query>` and `<queryCamel>` name the query whose key it invalidates (`list-invoices`, `listInvoices`); the configured module root replaces `src`:
   ```bash
   # query
   mkdir -p src/<module>/framework/queries && pnpm dlx ejs@7.0.2 <(sed -n '\#^```ejs src/<module>/framework/queries/<name>.query.ts$#,/^```$/{//!p}' <ref>/framework.examples.md) -o src/<module>/framework/queries/<name>.query.ts Name=<Name> name=<name> camel=<camel> Resource=<Resource> resource=<resource> resourceCamel=<resourceCamel> module=<module>
   # mutation
   mkdir -p src/<module>/framework/mutations && pnpm dlx ejs@7.0.2 <(sed -n '\#^```ejs src/<module>/framework/mutations/<name>.mutation.ts$#,/^```$/{//!p}' <ref>/framework.examples.md) -o src/<module>/framework/mutations/<name>.mutation.ts Name=<Name> name=<name> camel=<camel> Resource=<Resource> resource=<resource> resourceCamel=<resourceCamel> query=<query> queryCamel=<queryCamel> module=<module>
   ```
3. Per use case: one query or mutation that bridges it (keys from a factory), then the view-models the screens need. A mutation invalidates, on success, every query whose data it changed, through the key factories those queries export; the screen then reads again what the server says.
4. Per URL page whose state changes (a filter, a step, a draft, a selection, a message): one store, `stores/<page>.store.ts` named after the page, that holds every such state of that page and nothing that came from a fetch or a mutation. Where the stub kept local state (`useState`, `useReducer`), the real controller reads the page's store instead; keep local state only where the store cannot hold it, and expect the review to ask why (S23).
5. Per stub controller: the real one. It imports domain, queries, mutations, stores, view-models and other controllers; never the JSX, never the query client, never a platform global. It exports no type.

## End to end

The end-to-end tests written against the stubs are the proof of both parts. In the environment `e2e` the adapters are the in-memory ones, seeded with the literal data the stubs painted, so the same rows, totals and messages show once the real controllers are behind the screens. Keep the roles, labels and texts the tests check. `pnpm exec factory test e2e` runs them: at the close of each phase that touches the screens, and at verify.

**Spike:** `react` is `clean-react`'s spike workstream: the plan spikes the screens as throwaway HTML and the person approves them; `react` builds them first, from those spikes, against its stubs.

**Declared skills** (installed with the package, at the commit its manifest pins; never edit them):

- `composition-patterns`: sections 1, 3 and 4 (component architecture, implementation patterns, React 19 APIs) when writing components; section 2 (state management: decouple the implementation, the context interface, lift state) when writing stores.
- `web-design-guidelines`: after the pages exist, review `framework/ui` with it. It fetches the current guidelines at run time, so it needs the network; offline, skip it and say so.
- Where they disagree with this factory, the factory's rules win. Comparisons and counts stay in the controller (`jsx-neither-compares-nor-counts`). A controller's `isEmpty` or `isSelected` is a value the JSX reads, not a "boolean prop" of a component API.

**Check:** `pnpm exec factory check --workstream react [--module <module>]` and the project's type check, then the web-design review. The end-to-end tests are not part of this check: halfway through a phase the core may not be built yet. `renderHook` tests over an in-memory adapter are a later decision.
