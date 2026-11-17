import { existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import type { PlantAcl, PlantRecord, Product, RootRecord } from "../acl/plant.acl.ts";

export class PlantAdapter implements PlantAcl {
  private readonly root: string;
  private readonly readProducts: (root: string) => Promise<Product[]>;

  constructor(root: string, readProducts: (root: string) => Promise<Product[]>) {
    this.root = root;
    this.readProducts = readProducts;
  }

  async readPlant(): Promise<PlantRecord> {
    const products = await this.readProducts(this.root);
    return {
      root: this.root,
      lines: products.map(({ name, root, schema, config }) => ({
        name,
        folder: root,
        process: schema,
        roots: config,
      })),
    };
  }

  async prepareRoots(root: string, inputs: RootRecord): Promise<string[]> {
    return prepareRoots(root, inputs);
  }
}

/** The base laid under a new module root when the configuration declares none. */
const DEFAULT_BASE = [
  "shared/domain",
  "shared/application",
  "shared/infrastructure",
];

type Roots = Pick<RootRecord, "modules" | "acceptance" | "integration" | "unit" | "base">;

/**
 * `factory prepare`: the minimum the implementer needs before any workstream. Every configured
 * root that does not exist is created; a new module root also gets the configured `base` (or
 * `DEFAULT_BASE`). An existing directory is never touched, so running it twice changes nothing.
 * Returns the directories it created, relative to `cwd`.
 */
export const prepareRoots = (cwd: string, o: Roots): string[] => {
  const created: string[] = [];
  const make = (dir: string) => {
    if (existsSync(join(cwd, dir))) return;
    mkdirSync(join(cwd, dir), { recursive: true });
    created.push(dir);
  };
  const moduleRoot = o.modules.replace(/\/\*$/, "");
  if (!existsSync(join(cwd, moduleRoot))) {
    make(moduleRoot);
    for (const dir of o.base ?? DEFAULT_BASE) make(`${moduleRoot}/${dir}`);
  }
  make(o.acceptance);
  make(o.integration);
  make(o.unit);
  return created;
};
