# Several products in one repository

A repository can hold several products, each in its own folder and governed by one schema. Declare them in `factory.config.ts`:

```ts
export default {
  products: {
    api: { root: "apps/api", schema: "clean-backend" },
    worker: { root: "apps/worker", schema: "clean-backend", modules: "lib/*" },
    contracts: { root: "packages/contracts", schema: "spec-plan" },
  },
};
```

- A product's settings come from its schema's defaults, then the top level of `factory.config.ts`, then its own entry. Its roots (`modules`, `acceptance`, `integration`, `unit`, `entry`) are read inside its folder.
- Its specs live at `openspec/specs/<product>/<module>/<use-case>/spec.md`, and the decisions its changes consolidate at `openspec/adr/<product>/`. There is one `openspec/` at the repository root.
- Every change builds one product, named as `x-product` in its `.openspec.yaml`, and is made with that product's schema. The changes of one intention name each other under `x-linked`. `factory validate` checks both.
- The write guard opens a product's folder only to a change of that product. The gate, `factory verify` and `factory implement` judge a change by its own product alone.
- `check`, `generate`, `test`, `prepare` and `review` run once per product, or for one with `--product <name>`. `factory schemas` lists the products.

A project with no `products` has one product at its root and works as before. A project that installs `fullstack` has two schemas that build product code, so it declares its products, or names the one schema it uses as `schema`:

```ts
export default {
  products: {
    api: { root: "apps/api", schema: "clean-backend" },
    web: { root: "apps/web", schema: "clean-react" },
  },
};
```
