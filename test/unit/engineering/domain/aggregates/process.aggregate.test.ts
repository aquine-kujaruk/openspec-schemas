import { describe, expect, it } from "vitest";

import { ProcessAggregate } from "../../../../../factory/engineering/domain/aggregates/process.aggregate.ts";
import { WorkCenterEntity } from "../../../../../factory/engineering/domain/entities/work-center.entity.ts";
import { EngineeringException } from "../../../../../factory/engineering/domain/exceptions/engineering.exceptions.ts";


const center = (name: string, ...dependsOn: string[]) =>
  new WorkCenterEntity({
    id: name,
    parts: [],
    waitsFor: dependsOn,
  });

const processOf = (...workCenters: WorkCenterEntity[]) =>
  new ProcessAggregate({ name: "clean-backend", workCenters });

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

  it("names the cycle it finds", () => {
    expect(processOf(center("design", "build"), center("build", "design")).cycle()).toEqual(["design", "build", "design"]);
    expect(processOf(center("design"), center("build", "design")).cycle()).toBeUndefined();
  });
});

describe("the workstreams of a schema, through the process", () => {
  const ws = (id: string, ...dependsOn: string[]) => ({ id, layers: [{ name: id }], checks: [], dependsOn });
  const line = [ws("modules", "adapters"), ws("adapters", "app-domain"), ws("app-domain"), ws("react")];

  it("orders, finds the upstream and the parallel work with the aggregate's one calculation", () => {
    expect(ProcessAggregate.runOrder(line)).toEqual(["app-domain", "adapters", "modules", "react"]);
    expect(ProcessAggregate.upstream(line, "modules")).toEqual(["app-domain", "adapters"]);
    expect(ProcessAggregate.mayRunTogether(line, "react", "modules")).toBe(true);
    expect(ProcessAggregate.withUpstream(line, "adapters").map((w) => w.id)).toEqual(["adapters", "app-domain"]);
  });

  it("rejects a topology whose dependencies form a cycle, naming it", () => {
    const topology = { a: { dependsOn: ["b"] }, b: { dependsOn: ["a"] } };
    const folders = { a: { layerFiles: [] }, b: { layerFiles: [] } };
    const declarations = { a: { layers: () => [] }, b: { layers: () => [] } };
    expect(() => ProcessAggregate.loadWorkstreams(declarations, folders, topology, {} as never)).toThrow("workstream cycle: a → b → a");
  });
});
