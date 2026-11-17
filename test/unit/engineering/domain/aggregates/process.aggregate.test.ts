import { describe, expect, it } from "vitest";
import { ProcessName } from "../../../../../factory/shared/domain/value-objects/process-name.value-object.ts";
import { Process } from "../../../../../factory/engineering/domain/aggregates/process.aggregate.ts";
import { WorkCenter } from "../../../../../factory/engineering/domain/entities/work-center.entity.ts";
import { EngineeringException } from "../../../../../factory/engineering/domain/exceptions/engineering.exceptions.ts";
import { WorkCenterId } from "../../../../../factory/engineering/domain/value-objects/work-center-id.value-object.ts";

const center = (name: string, ...dependsOn: string[]) =>
  new WorkCenter({
    id: new WorkCenterId({ value: name }),
    parts: [],
    waitsFor: dependsOn.map((value) => new WorkCenterId({ value })),
  });

const processOf = (...workCenters: WorkCenter[]) =>
  new Process({ name: new ProcessName({ value: "clean-backend" }), workCenters });

describe("process work centers", () => {
  it("runs dependencies first and allows independent work together", () => {
    const design = center("design");
    const build = center("build", "design");
    const proof = center("proof", "build");
    const inventory = center("inventory", "design");
    const process = processOf(proof, inventory, build, design);

    expect(process.executionOrder()).toEqual([design, build, proof, inventory]);
    expect(process.prerequisites(proof.id)).toEqual([design, build]);
    expect(process.mayRunTogether(inventory.id, proof.id)).toBe(true);
    expect(process.mayRunTogether(design.id, proof.id)).toBe(false);
  });

  it("rejects a cycle or an unknown work center", () => {
    expect(() => processOf(center("design", "build"), center("build", "design")).executionOrder())
      .toThrow(EngineeringException);
    expect(() => processOf(center("proof", "build")).executionOrder())
      .toThrow("Unknown work center build");
  });
});
