import { describe, expect, it } from "vitest";
import { LineEntity } from "../../../../../factory/shared/domain/entities/line.entity.ts";
import { PlantEntity } from "../../../../../factory/shared/domain/entities/plant.entity.ts";

import { LineRootsValueObject } from "../../../../../factory/shared/domain/value-objects/line-roots.value-object.ts";


const roots = new LineRootsValueObject({
  modules: "src/*",
  productSpecs: "openspec/specs/*/*/spec.md",
  entry: ["src/main.ts"],
  acceptance: "test/acceptance",
  unit: "test/unit",
  integration: "test/integration",
  e2e: "test/e2e",
  ignore: [],
});

const line = (name: string, folder: string) =>
  new LineEntity({
    name: name,
    folder,
    process: "clean-backend",
    roots,
  });

describe("Plant", () => {
  it("finds the implicit line by its empty configured name", () => {
    const implicit = line("", ".");
    const plant = new PlantEntity({ root: "/workspace/project", lines: [implicit] });

    expect(plant.findLine("")).toBe(implicit);
    expect(implicit.folder).toBe(".");
  });

  it("distinguishes named lines even when they use the same process", () => {
    const api = line("api", "products/api");
    const worker = line("worker", "products/worker");
    const plant = new PlantEntity({ root: "/workspace/project", lines: [api, worker] });

    expect(plant.findLine("worker")).toBe(worker);
    expect(api.process).toBe(worker.process);
    expect(plant.findLine("unknown")).toBeUndefined();
  });
});
