import { describe, expect, it } from "vitest";
import { Line } from "../../../../../factory/shared/domain/entities/line.entity.ts";
import { Plant } from "../../../../../factory/shared/domain/entities/plant.entity.ts";
import { LineName } from "../../../../../factory/shared/domain/value-objects/line-name.value-object.ts";
import { LineRoots } from "../../../../../factory/shared/domain/value-objects/line-roots.value-object.ts";
import { ProcessName } from "../../../../../factory/shared/domain/value-objects/process-name.value-object.ts";

const roots = new LineRoots({
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
  new Line({
    name: new LineName({ value: name }),
    folder,
    process: new ProcessName({ value: "clean-backend" }),
    roots,
  });

describe("Plant", () => {
  it("finds the implicit line by its empty configured name", () => {
    const implicit = line("", ".");
    const plant = new Plant({ root: "/workspace/project", lines: [implicit] });

    expect(plant.findLine(new LineName({ value: "" }))).toBe(implicit);
    expect(implicit.folder).toBe(".");
  });

  it("distinguishes named lines even when they use the same process", () => {
    const api = line("api", "products/api");
    const worker = line("worker", "products/worker");
    const plant = new Plant({ root: "/workspace/project", lines: [api, worker] });

    expect(plant.findLine(new LineName({ value: "worker" }))).toBe(worker);
    expect(api.process.equals(worker.process)).toBe(true);
    expect(plant.findLine(new LineName({ value: "unknown" }))).toBeUndefined();
  });
});
