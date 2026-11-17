// Synced by feat2test. Matching step implementations are preserved.

import { expect } from "vitest";
import { HoldStageUseCase } from "../../../factory/quality/application/use-cases/hold-stage.use-case.ts";
import type { StageRecord, StageWorkstream } from "../../../factory/quality/domain/schemas/stage-hold.schema.ts";
import type { StageHold } from "../../../factory/quality/domain/value-objects/stage-hold.value-object.ts";
import { InMemoryStageHoldRepository } from "./repositories/in-memory-stage-hold.repository.ts";

const CHANGE = "add-orders";
const PHASE = "Step 1 works";
const streams: StageWorkstream[] = [
  { id: "app-domain", upstream: [], tests: ["acceptance", "unit"] },
  { id: "modules", upstream: ["app-domain"], tests: [] },
];

export function createSteps() {
  const repository = new InMemoryStageHoldRepository();
  const check = new HoldStageUseCase(repository);
  let building = 1;
  let made = "clean-backend";
  let failed = 0;
  let altered: string | undefined;
  let declared = new Set<string>();
  let built: string | undefined;
  let failingProduct: string | undefined;
  let findings: string[] = [];
  let productFails = false;
  let outcome: StageHold;

  return {
    // Context
    changeChecks(checks: string): void {
      findings = checks === "pass" ? [] : ["the check of app-domain fails"];
    },
    failedAttemptsBefore(failures: string): void {
      failed = Number(failures);
    },
    harnessPartAltered(part: string): void {
      altered = part;
    },
    changesInImplementation(changes: string): void {
      building = Number(changes);
    },
    changeInImplementationWithSchema(schema: string): void {
      made = schema;
    },
    productChecks(checks: string): void {
      productFails = checks === "fail";
    },
    projectDeclaresProducts(products: string): void {
      declared = new Set(products.split(", ").map((item) => item.split(" ")[0]!));
    },
    changeOfProductInImplementation(product: string): void {
      expect(declared.has(product)).toBe(true);
      built = product;
    },
    productChecksFail(failing: string): void {
      failingProduct = failing;
    },

    // Action
    async aboutToFinish(agentKind: string): Promise<void> {
      expect(["main", "helper"]).toContain(agentKind);
      const records = new Map<string, StageRecord>();
      if (failed) records.set(CHANGE, { phase: PHASE, failures: failed, waitingFor: "the agent", findings: [] });
      repository.seed({
        stages: Array.from({ length: building }, (_, index) => ({
          name: index === 0 ? CHANGE : `${CHANGE}-${index + 1}`,
          process: made,
          line: built,
          phases: [{ title: PHASE, tasks: [{ done: false, workstream: "app-domain" }, { done: false, workstream: "modules" }] }],
        })),
        workstreams: made === "spec-plan" ? [] : streams,
        harnessFindings: altered ? [`${altered}: its installed files were changed`] : [],
        records,
        failedLines: new Set(failingProduct === undefined ? (productFails || findings.length ? [built ?? ""] : []) : [failingProduct]),
      });
      outcome = await check.execute(agentKind === "helper");
      if (built && repository.runs.length) expect(repository.runs.every(({ line }) => line === built)).toBe(true);
    },

    // Outcome
    finishVerdict(verdict: string): void {
      expect(outcome.allowed ? "allowed" : "refused", outcome.reasons.join("\n")).toBe(verdict);
    },
    async failedAttemptsCounted(failuresAfter: string): Promise<void> {
      expect((await repository.readRecord(CHANGE)).failures).toBe(Number(failuresAfter));
    },
    async changeWaitingFor(waitingFor: string): Promise<void> {
      expect((await repository.readRecord(CHANGE)).waitingFor).toBe(waitingFor);
    },
    refusalNamesHarnessPart(part: string): void {
      expect(outcome.reasons.join("\n")).toContain(`${part}:`);
      expect(repository.runs).toHaveLength(0);
    },
  };
}
