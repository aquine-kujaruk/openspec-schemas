// Synced by feat2test. Matching step implementations are preserved.

import { expect } from "vitest";
import { InspectWorkOrderUseCase, type InspectionOptions } from "../../../factory/quality/application/use-cases/inspect-work-order.use-case.ts";
import type { QualityCertificate } from "../../../factory/quality/domain/aggregates/quality-certificate.aggregate.ts";
import type { GaugeReport, InspectionDrawings, Workstream } from "../../../factory/quality/domain/schemas/inspect-work-order.schema.ts";
import type { E2eResult } from "../../../factory/quality/domain/schemas/quality-certificate.schema.ts";
import { InMemoryFinalInspectionRepository } from "./repositories/in-memory-final-inspection.repository.ts";

const CHANGE = "add-orders";
const PROCEDURE = "run-orders";
const DELTA = "## ADDED Requirements\n\n### Requirement: An order is found by its identifier";
const streams: Workstream[] = [
  { id: "app-domain", upstream: [], tests: ["acceptance", "unit"] },
  { id: "infrastructure", upstream: ["app-domain"], tests: ["integration"] },
  { id: "modules", upstream: ["infrastructure"], tests: [] },
];

export function createSteps() {
  const records = new InMemoryFinalInspectionRepository();
  const inspect = new InspectWorkOrderUseCase(records);
  let total = 0;
  let proved = 0;
  const checkFailures = new Map<string, string>();
  let auditWarnings: string[] = [];
  let auditConfigured = false;
  let tagged: string | undefined;
  let probedAs: string | undefined;
  let givenOutcome: string | undefined;
  let certificate: QualityCertificate;
  let delivered: { repository: boolean; spec: string } | undefined;
  const adapterFolders = new Map<string, string>();
  let written = true;
  let operations: string | undefined;
  const vouched: string[] = [];
  let platformName = "node";
  let wholeOutput = "";
  const workstreamOwners = new Map<string, string>();
  let e2e: E2eResult[] = [];
  let failedE2e: string | undefined;
  const product = new Map([["src/orders/domain/order.entity.ts", "export class OrderEntity {}"]]);
  const before = [...product];

  const measurements = (): { drawings: InspectionDrawings; gauges: GaugeReport } => {
    if (delivered) {
      const pieces = delivered.spec.split("/");
      const folder = delivered.repository
        ? adapterFolders.get(delivered.spec)
        : `test/acceptance/${pieces.at(-2)}`;
      const gauge = folder ? `${folder}/${pieces.at(-1)}.feature.test.ts` : undefined;
      return {
        drawings: [{ spec: delivered.spec, text: operations ?? DELTA, gauge }],
        gauges: gauge && written ? [{
          name: gauge,
          assertions: [{ requirement: "An order is found", scenario: "scenario 1", passed: true }],
        }] : [],
      };
    }
    if (!total) return { drawings: [], gauges: [] };
    const gauge = "test/acceptance/orders/get-order.feature.test.ts";
    return {
      drawings: [{ spec: "orders/get-order", text: DELTA, gauge }],
      gauges: [{
        name: gauge,
        assertions: Array.from({ length: total }, (_, i) => ({
          requirement: "An order is found by its identifier",
          scenario: `scenario ${i + 1}`,
          passed: i < proved,
        })),
      }],
    };
  };

  const procedureOutcomes = (): InspectionOptions["procedures"] => {
    if (givenOutcome === undefined) return {
      [`${PROCEDURE}@local`]: "passed",
      [`${PROCEDURE}@sandbox`]: "passed",
    };
    if (givenOutcome === "none") return {};
    expect(["passed", "failed"]).toContain(givenOutcome);
    return { [`${PROCEDURE}@${tagged}`]: givenOutcome === "passed" ? "passed" : "failed" };
  };

  return {
    // Context
    builtChangeWithScenarios(scenarios: string): void {
      total = Number(scenarios);
    },
    scenariosPassing(passing: string): void {
      proved = Number(passing);
    },
    everyCheckPasses(): void {
      checkFailures.clear();
    },
    workstreamFailsCheck(workstream: string): void {
      proved = total;
      checkFailures.set(workstream, `the check of ${workstream} fails`);
    },
    reviewKeyIs(key: string): void {
      auditConfigured = key === "configured";
    },
    reviewRaisesWarnings(warnings: string): void {
      auditWarnings = Array.from({ length: Number(warnings) }, (_, i) =>
        `S09 p=0.9${i} src/orders/domain/order.entity.ts:1-2 — a name says the technology`,
      );
    },
    planProcedureTaggedFor(env: string): void {
      tagged = env;
    },
    planProcedureProbedAs(env: string, probed: string): void {
      tagged = env;
      probedAs = probed;
    },
    procedureOutcomeIs(outcome: string): void {
      givenOutcome = outcome;
    },
    changeOfWithDeltaSpec(where: string, spec: string): void {
      expect(["a project", "the command's repository"]).toContain(where);
      delivered = { repository: where === "the command's repository", spec };
    },
    stepAdapterHeldIn(spec: string, adapterFolder: string): void {
      adapterFolders.set(spec, adapterFolder);
    },
    generationWritesTests(tests: string, spec: string): void {
      written = Number(tests) > 0;
      if (!written) adapterFolders.delete(spec);
    },
    personsWordOn(spec: string, word: string): void {
      if (word === "proved") vouched.push(spec);
      else expect(word).toBe("none");
    },
    builtChangeOfPlatform(platform: string): void {
      platformName = platform;
    },
    wholeProductFailure(failure: string): void {
      failedE2e = /^the end-to-end test (\S+) fails$/.exec(failure)?.[1];
      const named = /^(\S+) names (\S+)$/.exec(failure);
      if (!named) return;
      const [, rule, file] = named;
      product.set(file!, "export const unused = 1;");
      before.push([file!, product.get(file!)!]);
      wholeOutput = `${rule}: ${file}`;
      if (file!.includes("/framework/ui/")) workstreamOwners.set(file!, "react-ui");
      else if (file!.includes("/domain/")) workstreamOwners.set(file!, "app-domain");
      else if (file!.includes("/infrastructure/")) workstreamOwners.set(file!, "infrastructure");
    },
    e2eTestResult(test: string, result: string): void {
      e2e = [{ test, result: result === "passes" ? "passed" : "failed" }];
    },
    removalLeaves(remaining: string): void {
      delivered = { repository: false, spec: "factory/quality/audit" };
      const other: Record<string, string> = {
        nothing: "",
        "an addition": DELTA,
        "a change": DELTA.replace("## ADDED Requirements", "## MODIFIED Requirements"),
        "a rename": "## RENAMED Requirements\n\n- FROM: `### Requirement: Before`\n- TO: `### Requirement: After`\n",
      };
      expect(Object.hasOwn(other, remaining)).toBe(true);
      operations = [
        "## REMOVED Requirements",
        "",
        "### Requirement: The old audit runs",
        "",
        "**Reason**: The old audit was retired.",
        "",
        "~~~md",
        "## ADDED Requirements",
        "~~~",
        "",
        other[remaining],
      ].join("\n");
    },
    remainingAcceptanceIs(status: string): void {
      written = status === "passing";
    },

    // Action
    async verifyChange(): Promise<void> {
      const { drawings, gauges } = measurements();
      records.seed({
        inspection: {
          name: CHANGE, repository: delivered?.repository ?? false, drawings,
          workstreams: streams,
          platform: platformName,
          procedures: tagged ? [{ slug: PROCEDURE, environments: [tagged], declined: probedAs === "declined" }] : [],
          review: { hasRubric: true, configured: auditConfigured, keyVariable: "OPENAI_API_KEY" },
        },
        gauges,
        checkFailures,
        wholeOutput,
        workstreamOwners,
        endToEnd: failedE2e ? [{ test: failedE2e, result: "failed" }] : e2e,
        warnings: auditWarnings,
      });
      certificate = await inspect.execute(CHANGE, { proved: vouched, procedures: procedureOutcomes() });
    },

    // Outcome
    evidenceMatchesScenarios(passing: string): void {
      expect(certificate.scenarios.filter(({ result }) => result === "passed")).toHaveLength(Number(passing));
    },
    changeReportedAs(verdict: string): void {
      expect(certificate.verdict).toBe(verdict);
      expect(records.certificates.get(CHANGE)?.verdict).toBe(verdict);
    },
    feedbackNamesWorkstream(workstream: string): void {
      expect(records.findings).toMatchObject([{ source: "the verify phase", names: workstream }]);
    },
    productFilesChanged(changedFiles: string): void {
      const original = new Map(before);
      const paths = new Set([...original.keys(), ...product.keys()]);
      const changes = [...paths].filter((name) => original.get(name) !== product.get(name));
      expect(changes).toHaveLength(Number(changedFiles));
    },
    evidenceRecordsReviewAs(review: string): void {
      expect(records.certificates.get(CHANGE)?.review.state).toBe(review);
    },
    evidenceListsWarnings(warnings: string): void {
      expect(records.certificates.get(CHANGE)?.review.warnings).toHaveLength(Number(warnings));
    },
    evidenceRecordsProcedureAs(env: string, treatment: string): void {
      expect(records.certificates.get(CHANGE)?.procedures).toMatchObject([{ slug: PROCEDURE, env, treatment }]);
    },
    scenariosReadFromTest(test: string): void {
      expect(records.requested).toEqual([test]);
      expect(certificate.scenarios).toMatchObject([{ scenario: "scenario 1", result: "passed" }]);
    },
    evidenceRecordsSpecAs(spec: string, proof: string): void {
      const result = records.certificates.get(CHANGE)?.scenarios.find((scenario) => scenario.spec === spec);
      if (proof === "proved by the person's word")
        expect(result).toMatchObject({ result: "passed", by: "the person" });
      else {
        expect(proof).toBe("unproved");
        expect(result).toMatchObject({ result: "missing" });
        expect(result?.by).toBeUndefined();
      }
    },
    feedbackRaisedOn(raisedOn: string): void {
      const names = records.findings.map(({ names }) => names);
      expect(names).toEqual(raisedOn === "nothing" ? [] : [raisedOn === "the change" ? CHANGE : raisedOn]);
    },
    evidenceRecordsE2e(test: string, recorded: string): void {
      expect(records.certificates.get(CHANGE)?.e2e).toMatchObject([{ test, result: recorded }]);
    },
    acceptanceFilesRequested(tests: string): void {
      expect(records.requested).toHaveLength(Number(tests));
      expect(certificate.scenarios).toHaveLength(Number(tests));
    },
  };

}
