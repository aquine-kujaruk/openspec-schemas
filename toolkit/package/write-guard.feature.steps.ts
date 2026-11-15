import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect } from "vitest";
import { guard, productRoots as rootsOf, type Refusal } from "./guard.ts";
import { projectConfig } from "../repository/products.ts";
import { declareProducts, productsOf, readyChange, scratchProject } from "../core/testing.ts";

/**
 * Each scenario judges a write in a project of its own. The project's changes are written when the
 * write is judged: as many in implementation as the scenario says, and the active change it names.
 */
export function createSteps() {
  const root = scratchProject("write-guard-");
  let building = 0;
  let made = "clean-backend";
  let active: string | undefined;
  let refusals: Refusal[] = [];
  let declared: Record<string, { root: string; schema: string }> = {};
  let product: string | undefined;

  const project = () => {
    const names = Array.from({ length: building }, (_, i) =>
      i === 0 && active ? active : `change-${i + 1}`,
    );
    for (const name of names) readyChange(root, name, { schema: made, product });
    if (active && !names.includes(active)) readyChange(root, active, { done: true });
  };

  return {
    // Context
    async productRoots(roots: string): Promise<void> {
      const configured = rootsOf(await projectConfig(root));
      for (const listed of roots.split(", "))
        expect(configured).toContain(listed.replace(/\/\*$/, ""));
    },
    async changesInImplementation(changes: string): Promise<void> {
      building = Number(changes);
    },
    async activeChange(change: string): Promise<void> {
      active = change;
    },
    async changeInImplementationWithSchema(schema: string): Promise<void> {
      building = 1;
      made = schema;
    },
    async projectDeclaresProducts(products: string): Promise<void> {
      declared = productsOf(products);
      declareProducts(root, products);
    },
    async changeOfProductInImplementation(changeProduct: string): Promise<void> {
      building = 1;
      product = changeProduct;
      made = declared[changeProduct]!.schema;
    },

    // Action
    async aboutToWrite(path: string): Promise<void> {
      project();
      refusals = await guard(root, [path]);
    },
    async aboutToWriteSeveral(paths: string): Promise<void> {
      project();
      refusals = await guard(root, paths.split(", "));
    },

    // Outcome
    async writeVerdict(verdict: string): Promise<void> {
      expect(refusals.length ? "refused" : "allowed", JSON.stringify(refusals)).toBe(verdict);
    },
    async refusalNamesPhase(phase: string): Promise<void> {
      expect(refusals.map((r) => r.reason).join("\n")).toContain(`\`${phase}\` phase`);
    },
    async refusalNamesHarnessPart(part: string): Promise<void> {
      expect(refusals.map((r) => r.part)).toContain(part);
      expect(refusals.map((r) => r.reason).join("\n")).toContain(part);
    },
  };
}
