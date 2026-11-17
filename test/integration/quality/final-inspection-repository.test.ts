import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { QualityCertificate } from "../../../factory/quality/domain/aggregates/quality-certificate.aggregate.ts";
import { ScenarioResult } from "../../../factory/quality/domain/value-objects/scenario-result.value-object.ts";
import type { FinalInspectionAcl } from "../../../factory/quality/infrastructure/acl/final-inspection.acl.ts";
import { QualityCertificateFileAdapter } from "../../../factory/quality/infrastructure/adapters/quality-certificate-file.adapter.ts";
import { FinalInspectionRepositoryImplementation } from "../../../factory/quality/infrastructure/repository-implementations/final-inspection.repository-implementation.ts";

const NAME = "add-orders";
const ORDERS = "openspec/changes";
const GAUGE = "test/acceptance/orders/list.feature.test.ts";

describe("the final inspection repository", () => {
  it("reads the runner's report and persists the verified certificate without touching the product", async () => {
    const root = mkdtempSync(join(tmpdir(), "quality-certificate-"));
    try {
      const dir = join(root, ORDERS, NAME);
      mkdirSync(dir, { recursive: true });
      mkdirSync(join(root, "src"));
      const plan = join(dir, "plan.md");
      const code = join(root, "src", "orders.ts");
      writeFileSync(plan, "- [ ] build orders\n");
      writeFileSync(code, "export const orders = [];\n");
      const files = new QualityCertificateFileAdapter(root, ORDERS, async () => ["src"]);
      const adapter: FinalInspectionAcl = {
        async load() {
          return {
            name: NAME, repository: false, drawings: [], workstreams: [], procedures: [],
            platform: "node", review: { hasRubric: true, keyVariable: "REVIEW_API_KEY", configured: false },
          };
        },
        async gauges(gauges) {
          expect(gauges).toEqual([GAUGE]);
          return [{
            name: GAUGE,
            assertionResults: [{
              ancestorTitles: ["Feature: Orders", "Rule: Orders can be listed"],
              title: "lists red | green orders",
              status: "passed",
            }],
          }];
        },
        async run() { return { status: 0, output: "" }; },
        async endToEnd() { return []; },
        async findWorkstream() { return undefined; },
        async audit() { return []; },
        digest: (name) => files.digestOf(name),
        async save(record) { files.writeEvidence(record); },
        async feedback() {},
      };
      const inspections = new FinalInspectionRepositoryImplementation(adapter);
      const [report] = await inspections.runGauges([GAUGE]);
      const scenarios = report!.assertions.map(({ requirement, scenario, passed }) =>
        new ScenarioResult({ spec: "orders/list", requirement, scenario, result: passed ? "passed" : "failed" }),
      );
      const digest = await inspections.readDigest(NAME);
      writeFileSync(plan, "- [x] build orders\n");
      expect(await inspections.readDigest(NAME)).toBe(digest);

      await inspections.saveCertificate(new QualityCertificate({
        workOrder: NAME,
        digest,
        scenarios,
        failing: [],
        procedures: [],
        review: { state: "skipped", warnings: [] },
      }));

      expect(files.readEvidence(NAME)).toEqual({ change: NAME, verdict: "verified", digest });
      const evidence = readFileSync(join(dir, "evidence.md"), "utf8");
      expect(evidence).toContain("Orders can be listed | lists red \\| green orders | passed");
      expect(evidence).toContain("## Review\n\nSkipped:");
      expect(readFileSync(code, "utf8")).toBe("export const orders = [];\n");
      writeFileSync(code, "export const orders = [1];\n");
      expect(await inspections.readDigest(NAME)).not.toBe(digest);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
});
