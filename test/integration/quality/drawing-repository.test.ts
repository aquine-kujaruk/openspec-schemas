import { expect, it } from "vitest";
import { MakeGaugesUseCase } from "../../../factory/quality/application/use-cases/make-gauges.use-case.ts";
import type { DrawingAcl } from "../../../factory/quality/infrastructure/acl/drawing.acl.ts";
import { DrawingRepositoryImplementation } from "../../../factory/quality/infrastructure/repository-implementations/drawing.repository-implementation.ts";

it("keeps the drawing, scenario and generated gauge related", async () => {
  const tool: DrawingAcl = {
    async makeGauges() {
      return {
        exitStatus: 0,
        drawings: [{
          path: "production/close-work-order",
          file: "test/acceptance/production/close-work-order.feature.test.ts",
          gherkin: "Feature: Close\n  Rule: Inspection passes\n    Scenario Outline: A released order closes\n",
        }],
      };
    },
  };

  const result = await new MakeGaugesUseCase(new DrawingRepositoryImplementation(tool)).execute(["--check"]);

  expect(result.drawings[0]?.scenarios).toEqual([{ title: "A released order closes", requirement: "Inspection passes" }]);
  expect(result.gauges[0]?.drawing).toBe(result.drawings[0]?.path);
  expect(result.exitStatus).toBe(0);
});
