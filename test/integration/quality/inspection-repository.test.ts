import { describe, expect, it } from "vitest";
import { LineName } from "../../../factory/shared/domain/value-objects/line-name.value-object.ts";
import type { InspectionAcl } from "../../../factory/quality/infrastructure/acl/inspection.acl.ts";
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
    const run = await repository.inspectLine(new LineName({value: "backend"}), ["--module", "orders"]);
    expect(run.passed()).toBe(false);
    expect(run.defects[0]).toMatchObject({ file: "orders.ts", tool: "fallow" });
  });
});
