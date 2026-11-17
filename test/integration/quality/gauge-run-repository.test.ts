import { expect, it } from "vitest";
import type { GaugeRunAcl } from "../../../factory/quality/infrastructure/acl/gauge-run.acl.ts";
import { GaugeRunRepositoryImplementation } from "../../../factory/quality/infrastructure/repository-implementations/gauge-run.repository-implementation.ts";

it("keeps the runner's report arguments and failure status", async () => {
  const runner: GaugeRunAcl = {
    async runGauges(args) {
      expect(args).toEqual(["integration", "--report", "tests.json"]);
      return 1;
    },
  };
  const gauges = new GaugeRunRepositoryImplementation(runner);
  await expect(gauges.runGauges(["integration", "--report", "tests.json"])).resolves.toBe(1);
});
