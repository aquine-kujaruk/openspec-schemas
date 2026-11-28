import { describe, expect, it } from "vitest";

import { ProcessRepositoryImplementation } from "../../../factory/engineering/infrastructure/repository-implementations/process.repository-implementation.ts";
import { ProcessAggregate } from "../../../factory/engineering/domain/aggregates/process.aggregate.ts";
import type { ProcessAcl } from "../../../factory/engineering/infrastructure/acl/process.acl.ts";

describe("process repository", () => {
  it("maps a process with dependencies, parts and standards", async () => {
    const definitions: ProcessAcl = {
      listProcesses: async () => [{
        name: "clean-backend", base: "clean-core", description: "Backend line",
        pilot: "model",
        workCenters: [
          { id: "build", waitsFor: ["model"], parts: [] },
          { id: "model", waitsFor: [], parts: [{
            name: "domain", standards: [{ id: "validate-props", title: "Validate props" }],
          }] },
        ],
      }],
    };
    const processes = new ProcessRepositoryImplementation(definitions);

    const process = ProcessAggregate.from((await processes.findProcess("clean-backend"))!);
    expect(process.base).toBe("clean-core");
    expect(process.pilot).toBe("model");
    const [model, build] = process.executionOrder();
    expect(build!.id).toBe("build");
    expect(model!.parts[0]!.standards[0]!.id).toBe("validate-props");
    expect(await processes.findProcess("unknown")).toBeNull();
  });
});
