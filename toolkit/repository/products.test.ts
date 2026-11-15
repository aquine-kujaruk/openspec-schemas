import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { write } from "../core/testing.ts";
import { listProducts } from "./schemas.ts";
import { currentProduct, PRODUCT_VARIABLE, productHolding, projectProducts } from "./products.ts";

/** Spec: `implementer`, "A project declares its products by folder" and "Each product's specs and acceptance tests live under that product". */
const project = (config?: object) => {
  const root = mkdtempSync(join(tmpdir(), "products-"));
  if (config) write(root, "factory.config.ts", `export default ${JSON.stringify(config)};\n`);
  return root;
};

const MONOREPO = {
  products: {
    api: { root: "apps/api", schema: "clean-backend", modules: "src/*" },
    worker: { root: "apps/worker", schema: "clean-backend", modules: "lib/*" },
    contracts: { root: "packages/contracts", schema: "spec-plan" },
  },
};

describe("a project declares its products by folder", () => {
  it.each([
    ["api", "modules", "apps/api/src/*"],
    ["worker", "modules", "apps/worker/lib/*"],
    ["api", "acceptance", "apps/api/test/acceptance"],
    ["api", "productSpecs", "openspec/specs/api/*/*/spec.md"],
    ["worker", "productSpecs", "openspec/specs/worker/*/*/spec.md"],
  ])("the product %s resolves %s to %s", async (name, setting, resolved) => {
    const products = await projectProducts(project(MONOREPO));
    const product = products.find((p) => p.name === name)!;
    expect((product.config as Record<string, unknown>)[setting]).toBe(resolved);
  });

  it("a product's entry is read under its folder", async () => {
    const [api] = await projectProducts(project(MONOREPO));
    expect(api!.config.entry).toEqual(["apps/api/src/*.ts"]);
  });

  it("the project's top level applies to every product, and a product's entry wins over it", async () => {
    const root = project({
      review: { threshold: 0.9 },
      schemaPackage: "valibot",
      products: { api: { root: "apps/api", schema: "clean-backend", schemaPackage: "zod" } },
    });
    const [api] = await projectProducts(root);
    expect(api!.config.review.threshold).toBe(0.9);
    expect(api!.config.schemaPackage).toBe("zod");
  });

  it("each product takes the defaults and workstreams of its own schema", async () => {
    const products = await projectProducts(project(MONOREPO));
    expect(Object.keys(products.find((p) => p.name === "api")!.config.workstreams)).toContain("app-domain");
    expect(products.find((p) => p.name === "contracts")!.config.workstreams).toEqual({});
  });

  it("the other products' folders may stay outside a product's zones", async () => {
    const [api] = await projectProducts(project(MONOREPO));
    expect(api!.config.allowUnmatched).toEqual(
      expect.arrayContaining(["apps/worker/**", "packages/contracts/**", "apps/api/*.config.*"]),
    );
  });

  it("a product without a root or a schema is refused by name", async () => {
    await expect(projectProducts(project({ products: { api: { schema: "clean-backend" } } }))).rejects.toThrow(
      /product api .* root and a schema/,
    );
  });

  it.each([["modules", "src/*"], ["acceptance", "test/acceptance"], ["productSpecs", "openspec/specs/*/*/spec.md"]])(
    "without products the project has one product at its root whose %s is %s",
    async (setting, resolved) => {
      const products = await projectProducts(project());
      expect(products).toHaveLength(1);
      expect(products[0]).toMatchObject({ name: "", root: "." });
      expect((products[0]!.config as Record<string, unknown>)[setting]).toBe(resolved);
    },
  );
});

describe("the product a run works on", () => {
  it("is the only one, the one named, or a refusal that says how to name one", async () => {
    expect((await currentProduct(project())).root).toBe(".");
    const root = project(MONOREPO);
    await expect(currentProduct(root)).rejects.toThrow(/--product/);
    process.env[PRODUCT_VARIABLE] = "worker";
    try {
      expect((await currentProduct(root)).root).toBe("apps/worker");
      process.env[PRODUCT_VARIABLE] = "web";
      await expect(currentProduct(root)).rejects.toThrow(/no product called web/);
    } finally {
      delete process.env[PRODUCT_VARIABLE];
    }
  });

  it("a path belongs to the product whose folder holds it", async () => {
    const products = await projectProducts(project(MONOREPO));
    expect(productHolding(products, "apps/api/src/orders/index.ts")?.name).toBe("api");
    expect(productHolding(products, "apps/apix/src/index.ts")).toBeUndefined();
    expect(productHolding(products, "README.md")).toBeUndefined();
  });
});

describe("factory schemas lists the products", () => {
  it("with their folder and schema, and none when the project declares none", async () => {
    expect(await listProducts(project(MONOREPO))).toEqual([
      { name: "api", root: "apps/api", schema: "clean-backend" },
      { name: "worker", root: "apps/worker", schema: "clean-backend" },
      { name: "contracts", root: "packages/contracts", schema: "spec-plan" },
    ]);
    expect(await listProducts(project())).toEqual([]);
  });
});
