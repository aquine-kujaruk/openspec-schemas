import { createHash } from "node:crypto";
import { mkdtempSync, readdirSync, readFileSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect } from "vitest";
import { type Evidence, readEvidence, type ScenarioResult } from "./evidence.ts";
import { raised } from "./feedback.ts";
import { block, change as writeChange, delta, write } from "./testing.ts";
import { verify } from "./verify.ts";

/**
 * Each scenario verifies one built change of a project of its own. What the checks, the acceptance
 * tests and the review would say is stood in for; the evidence and the feedback are the real ones.
 */
const CHANGE = "add-orders";
const PROCEDURE = "run-orders";

const product = (root: string): Record<string, string> =>
  Object.fromEntries(
    (readdirSync(join(root, "src"), { recursive: true }) as string[])
      .filter((f) => statSync(join(root, "src", f)).isFile())
      .map((f) => [f, createHash("sha256").update(readFileSync(join(root, "src", f))).digest("hex")]),
  );

export function createSteps() {
  const root = mkdtempSync(join(tmpdir(), "verify-"));
  let total = 0;
  let proved = 0;
  let failing: Evidence["failing"] = [];
  let env: Record<string, string> = {};
  let lines: string[] = [];
  let tagged: string | undefined;
  let evidence: Evidence | undefined;
  let changed = -1;

  return {
    // Context
    async builtChangeWithScenarios(scenarios: string): Promise<void> {
      total = Number(scenarios);
    },
    async scenariosPassing(passing: string): Promise<void> {
      proved = Number(passing);
    },
    async everyCheckPasses(): Promise<void> {
      failing = [];
    },
    async workstreamFailsCheck(workstream: string): Promise<void> {
      proved = total;
      failing = [{ workstream, output: `the check of ${workstream} fails` }];
    },
    async reviewKeyIs(key: string): Promise<void> {
      env = key === "configured" ? { OPENAI_API_KEY: "sk-test" } : {};
    },
    async reviewRaisesWarnings(warnings: string): Promise<void> {
      lines = Array.from(
        { length: Number(warnings) },
        (_, i) => `S09 p=0.9${i} src/orders/domain/order.entity.ts:1-2 — a name says the technology`,
      );
    },
    async planProcedureTaggedFor(env: string): Promise<void> {
      tagged = env;
    },

    // Action
    async verifyChange(): Promise<void> {
      writeChange(root, CHANGE, {
        deltas: total ? { "orders/get-order": delta() } : {},
        parts: {
          phases: [true],
          procedures: tagged
            ? [block("Procedure", PROCEDURE, ["@adds", "@purpose:operate", "@topic:orders", `@env:${tagged}`])]
            : [],
        },
      });
      write(root, "src/orders/domain/order.entity.ts", "export class OrderEntity {}\n");
      const results: ScenarioResult[] = Array.from({ length: total }, (_, i) => ({
        spec: "orders/get-order",
        requirement: "An order is found by its identifier",
        scenario: `scenario ${i + 1}`,
        result: i < proved ? "passed" : "failed",
      }));
      const before = product(root);
      evidence = await verify(root, CHANGE, {
        env,
        scenarios: async () => results,
        checks: async () => failing,
        review: async () => lines,
        procedures: { [`${PROCEDURE}@local`]: "passed", [`${PROCEDURE}@sandbox`]: "passed" },
      });
      const after = product(root);
      changed = Object.keys({ ...before, ...after }).filter((f) => before[f] !== after[f]).length;
    },

    // Outcome
    async evidenceMatchesScenarios(passing: string): Promise<void> {
      expect(evidence!.scenarios.filter((s) => s.result === "passed")).toHaveLength(Number(passing));
    },
    async changeReportedAs(verdict: string): Promise<void> {
      expect(evidence!.verdict).toBe(verdict);
      expect(readEvidence(root, CHANGE)?.verdict).toBe(verdict);
    },
    async feedbackNamesWorkstream(workstream: string): Promise<void> {
      expect(raised(root, CHANGE)).toMatchObject([{ source: "the verify phase", names: workstream }]);
    },
    async productFilesChanged(changedFiles: string): Promise<void> {
      expect(changed).toBe(Number(changedFiles));
    },
    async evidenceRecordsReviewAs(review: string): Promise<void> {
      expect(evidence!.review.state).toBe(review);
      expect(readFileSync(join(root, "openspec/changes", CHANGE, "evidence.md"), "utf8")).toContain(
        review === "run" ? "## Review\n\nRun:" : "## Review\n\nSkipped:",
      );
    },
    async evidenceListsWarnings(warnings: string): Promise<void> {
      expect(evidence!.review.warnings).toHaveLength(Number(warnings));
    },
    async evidenceRecordsProcedureAs(env: string, treatment: string): Promise<void> {
      expect(evidence!.procedures).toMatchObject([{ slug: PROCEDURE, env, treatment }]);
    },
  };
}
