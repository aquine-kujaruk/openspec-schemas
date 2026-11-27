import { describe, expect, it } from "vitest";
import { QualityControlRunAggregate } from "../../../../../factory/quality/domain/aggregates/quality-control-run.aggregate.ts";
import { DefectValueObject } from "../../../../../factory/quality/domain/value-objects/defect.value-object.ts";

describe("quality control", () => {
  const defect = new DefectValueObject({file: "orders.ts", standard: "every-file-in-a-zone", tool: "fallow"});

  it("requires both a successful runner and no defects", () => {
    expect(new QualityControlRunAggregate({exitStatus: 0, defects: []}).passed()).toBe(true);
    expect(new QualityControlRunAggregate({exitStatus: 0, defects: [defect]}).passed()).toBe(false);
    expect(new QualityControlRunAggregate({exitStatus: 2, defects: []}).passed()).toBe(false);
  });
});
