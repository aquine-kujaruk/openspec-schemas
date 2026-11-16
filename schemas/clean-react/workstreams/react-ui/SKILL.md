---
name: react-ui
description: Build the react-ui workstream of the implementer: the JSX of the framework (pages and components in framework/ui, the bridges and the entry), built against a stub controller per page. Read from the implement skill.
---

# react-ui

**Owns:** `src/<module>/framework/ui/` (pages and components, `.tsx` only), `src/<module>/framework/bridges/` and the entry (`src/main.tsx`: providers, bridges and routing). Navigation lives here: `ui`, bridges and the entry may read and change the location; nothing here persists or talks to the network.

**Paths:** every path here is written at the defaults. In a project with products, it sits in the folder of the change's product and under that product's configured roots (`pnpm exec factory schemas` lists each product's folder): `src` stands for the module root, and `src/main.tsx` for the configured entry. A scaffold's info string stays as written; only `mkdir -p` and `-o` take the product's path.

**Receives:** the screens of the change and the domain entities and value objects they paint. Nothing from other workstreams: what a page needs from a controller is discovered by writing the page.

**Fakes:** the controller, and only it. Each page destructures one hook, `use<Name>Controller` from `framework/controllers/<name>.controller.ts`. While `react-hooks` has not written it, `react-ui` writes it as a stub that returns literal data and imports nothing:

```ts
export const useOrdersListController = () => ({
  rows: [{ id: "O-1", placedOn: "2026-01-05", status: "Pending", total: "25.98 EUR" }],
  isEmpty: false,
  onNext: () => {},
});
```

The page infers its props from the stub (`ReturnType<typeof useX>` when a component needs the type); the controller exports no type. A page reaches the core only through its controller: never a query, a store or the query client.

## How

1. Read the `## reference` of `ui.examples.md`: it is the shape of correct code. The other sections show each way of breaking a rule.
2. Start every page and every stub controller from its scaffold, then fill it in; never write one of them from nothing. `<ref>` is the folder this skill is in, `<Name>` and `<name>` the screen's name in PascalCase and kebab-case, and the configured module root replaces `src`:
   ```bash
   # stub controller (react-hooks later replaces its body, keeping its shape)
   mkdir -p src/<module>/framework/controllers && pnpm dlx ejs@7.0.2 <(sed -n '\#^```ejs src/<module>/framework/controllers/<name>.controller.ts$#,/^```$/{//!p}' <ref>/ui.examples.md) -o src/<module>/framework/controllers/<name>.controller.ts Name=<Name> name=<name> module=<module>
   # page
   mkdir -p src/<module>/framework/ui/<name> && pnpm dlx ejs@7.0.2 <(sed -n '\#^```ejs src/<module>/framework/ui/<name>/<name>.page.tsx$#,/^```$/{//!p}' <ref>/ui.examples.md) -o src/<module>/framework/ui/<name>/<name>.page.tsx Name=<Name> name=<name> module=<module>
   ```
3. Per screen: the page, its components, its stub controller with the literal data the page paints. The JSX neither compares nor counts: the controller exposes `isEmpty`, `isSelected`, `count`.
4. Routing and anything that must read the location go in a bridge (`x.bridge.tsx`), which the entry mounts.
5. Mount the app with the project's own command and look at each screen against its stub.

**Declared skills** (installed with the package, at the commit its manifest pins; never edit them):

- `composition-patterns`: sections 1, 3 and 4 (component architecture, implementation patterns, React 19 APIs) when writing components. Section 2 belongs to `react-hooks`.
- `web-design-guidelines`: after the pages exist, review `framework/ui` with it. It fetches the current guidelines at run time, so it needs the network; offline, skip it and say so.
- Where they disagree with this factory, the factory's rules win. Comparisons and counts stay in the controller (`jsx-neither-compares-nor-counts`). A controller's `isEmpty` or `isSelected` is a value the JSX reads, not a "boolean prop" of a component API.

**Spike:** `react-ui` is `clean-react`'s spike workstream. The plan phase builds it, where it stays, against the stub controllers, while the person approves each screen; the implementation then starts at `react-hooks`. The end-to-end tests the plan writes under `test/e2e` pass against these pages and their stubs, so keep the roles, labels and texts they check.

**Check:** `pnpm exec factory check --workstream react-ui [--module <module>]`, then the web-design review. The product's end-to-end tests run with `pnpm exec factory test e2e`.
