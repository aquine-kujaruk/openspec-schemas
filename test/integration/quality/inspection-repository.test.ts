import { describe, expect, it } from "vitest";

import type { InspectionAcl } from "../../../factory/quality/infrastructure/acl/inspection.acl.ts";
import { QualityControlRunAggregate } from "../../../factory/quality/domain/aggregates/quality-control-run.aggregate.ts";
import { InspectionRepositoryImplementation } from "../../../factory/quality/infrastructure/repository-implementations/inspection.repository-implementation.ts";

describe("inspection repository", () => {
  it("records why the inspection failed for the given line and scope", async () => {
    const tool: InspectionAcl = {
      async inspectLine(line, scope) {
        expect(line).toBe("backend");
        expect(scope).toEqual(["--module", "orders"]);
        return {
          exitStatus: 1,
          defects: [{ file: "orders.ts", standard: "every-file-in-a-zone", tool: "fallow" }],
        };
      },
    };
    const repository = new InspectionRepositoryImplementation(tool);
    const run = QualityControlRunAggregate.from(await repository.inspectLine("backend", ["--module", "orders"]));
    expect(run.passed()).toBe(false);
    expect(run.defects[0]).toMatchObject({ file: "orders.ts", tool: "fallow" });
  });
});
