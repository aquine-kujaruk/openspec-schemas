import { describe, expect, it } from "vitest";
import { PlantRepositoryImplementation } from "../../../factory/engineering/infrastructure/repository-implementations/plant.repository-implementation.ts";
import type { PlantAcl, PlantRecord } from "../../../factory/engineering/infrastructure/acl/plant.acl.ts";
import { PlantEntity } from "../../../factory/shared/domain/entities/plant.entity.ts";
import { EngineeringException } from "../../../factory/engineering/domain/exceptions/engineering.exceptions.ts";

const record: PlantRecord = {
  root: "/factory",
  lines: [{
    name: "", folder: ".", process: "clean-backend",
    roots: {
      modules: "factory/*", productSpecs: "openspec/specs/*/*/spec.md",
      entry: ["factory/main.ts"], acceptance: "test/acceptance", integration: "test/integration",
      unit: "test/unit", e2e: "test/e2e", ignore: ["docs/**"],
    },
  }],
};

describe("plant repository", () => {
  it("loads the implicit line and prepares its configured roots", async () => {
    const files: PlantAcl = {
      readPlant: async () => record,
      prepareRoots: async (root, paths) => [root, paths.unit],
    };
    const plants = new PlantRepositoryImplementation(files);

    const plant = PlantEntity.from(await plants.getPlant());
    expect(plant.root).toBe(record.root);
    const [line] = plant.lines;
    expect(line?.name).toBe("");
    expect(line?.process).toBe("clean-backend");
    expect(await plants.prepareRoots(plant, line!)).toEqual(["/factory", "test/unit"]);
  });

  it("retains the resource failure as its cause", async () => {
    const cause = new Error("unable to read");
    const files: PlantAcl = {
      readPlant: async () => { throw cause; },
      prepareRoots: async () => [],
    };
    const plants = new PlantRepositoryImplementation(files);

    await expect(plants.getPlant()).rejects.toThrow(EngineeringException);
    await expect(plants.getPlant()).rejects.toMatchObject({ cause });
  });
});
