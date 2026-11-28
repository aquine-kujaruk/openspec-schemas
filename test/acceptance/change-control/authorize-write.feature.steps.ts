// Synced by feat2test. Matching step implementations are preserved.

import { expect } from "vitest";
import { AuthorizeWriteUseCase } from "../../../factory/change-control/application/use-cases/authorize-write.use-case.ts";
import type { WritableLine } from "../../../factory/change-control/domain/schemas/write-boundary.schema.ts";
import type { AuthorizationValueObject } from "../../../factory/change-control/domain/value-objects/authorization.value-object.ts";
import { InMemoryReleasedWorkOrderRepository } from "./repositories/in-memory-released-work-order.repository.ts";
import { InMemoryWriteBoundaryRepository } from "./repositories/in-memory-write-boundary.repository.ts";

export function createSteps() {
  const boundary = new InMemoryWriteBoundaryRepository();
  const orders = new InMemoryReleasedWorkOrderRepository();
  const authorize = new AuthorizeWriteUseCase(boundary, orders);
  const configuredRoots = ["src", "test/acceptance", "test/integration", "test/unit"];
  let building = 0;
  let made = "clean-backend";
  let active: string | undefined;
  let line: string | undefined;
  let declared: Array<WritableLine & { process: string }> = [];
  let implicitRoots = configuredRoots;
  let authorization: AuthorizationValueObject;

  const judge = async (files: string[]): Promise<void> => {
    boundary.seed({
      lines: declared.length ? declared : [{ name: "", folder: ".", roots: implicitRoots, acceptance: "test/acceptance" }],
      changes: "openspec/changes",
      decisions: "openspec/adr",
      procedures: "openspec/runbooks",
    });
    orders.seed(Array.from({ length: building }, (_, i) => ({
      name: i === 0 && active ? active : `change-${i + 1}`,
      process: made,
      builds: made !== "spec-plan",
      line,
    })));
    authorization = await authorize.execute(files);
  };

  return {
    // Context
    productRoots(roots: string): void {
      implicitRoots = roots.split(", ").map((root) => root.replace(/\/\*$/, ""));
      for (const root of implicitRoots) expect(configuredRoots).toContain(root);
    },
    changesInImplementation(changes: string): void {
      building = Number(changes);
    },
    activeChange(change: string): void {
      active = change;
    },
    changeInImplementationWithSchema(schema: string): void {
      building = 1;
      made = schema;
    },
    projectDeclaresProducts(products: string): void {
      declared = products.split(", ").map((product) => {
        const declaration = /^(\S+) at (\S+)(?: with the schema (\S+))?$/.exec(product);
        expect(declaration, product).not.toBeNull();
        const [, name, folder, process = "clean-backend"] = declaration!;
        return {
          name: name!,
          folder: folder!,
          roots: configuredRoots.map((root) => `${folder}/${root}`),
          acceptance: `${folder}/test/acceptance`,
          process,
        };
      });
    },
    changeOfProductInImplementation(changeProduct: string): void {
      const product = declared.find(({ name }) => name === changeProduct);
      expect(product, changeProduct).toBeDefined();
      building = 1;
      line = changeProduct;
      made = product!.process;
    },

    // Action
    async aboutToWrite(path: string): Promise<void> {
      await judge([path]);
    },
    async aboutToWriteSeveral(paths: string): Promise<void> {
      await judge(paths.split(", "));
    },

    // Outcome
    writeVerdict(verdict: string): void {
      expect(authorization.allowed ? "allowed" : "refused", JSON.stringify(authorization.refusals)).toBe(verdict);
    },
    refusalNamesPhase(phase: string): void {
      expect(authorization.refusals.map(({ reason }) => reason).join("\n")).toContain(`\`${phase}\` phase`);
    },
    refusalNamesHarnessPart(part: string): void {
      expect(authorization.blockedBy?.name).toBe(part);
      expect(authorization.refusals.map(({ part }) => part)).toContain(part);
      expect(authorization.refusals.map(({ reason }) => reason).join("\n")).toContain(part);
    },
    workOrdersRead(reads: string): void {
      expect(orders.reads).toBe(Number(reads));
    },
  };
}
