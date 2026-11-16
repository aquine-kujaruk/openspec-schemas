import { createHash } from "node:crypto";
import { mkdtempSync, readdirSync, readFileSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect } from "vitest";
import { type E2eResult, type Evidence, readEvidence, type ScenarioResult } from "./evidence.ts";
import { raised } from "./feedback.ts";
import { block, change as writeChange, delta, ONE_SCHEMA, scratchProject, write } from "../core/testing.ts";
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
  const root = scratchProject("verify-");
  let total = 0;
  let proved = 0;
  let failing: Evidence["failing"] = [];
  let env: Record<string, string> = {};
  let lines: string[] = [];
  let tagged: string | undefined;
  let probedAs: string | undefined;
  // The outcome given for the procedure in its environment; by default, every safe one passed.
  let givenOutcome: string | undefined;
  let evidence: Evidence | undefined;
  let changed = -1;
  // The scenarios on where a spec's test is written: the layout is the scenario's, the tests stood in for.
  let delivered: { repository: boolean; spec: string } | undefined;
  const adapters = new Map<string, string>();
  let written = true;
  const vouched: string[] = [];
  let asked: string[] = [];
  // The scenarios on whole-product checks and end-to-end tests: what those print stood in for.
  let builtOn: string | undefined;
  let wholeOutputs: string[] = [];
  let e2eResults: E2eResult[] = [];
  let lastFailure = "";

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
    async planProcedureProbedAs(env: string, probed: string): Promise<void> {
      tagged = env;
      probedAs = probed;
    },
    async procedureOutcomeIs(outcome: string): Promise<void> {
      givenOutcome = outcome;
    },
    async changeOfWithDeltaSpec(where: string, spec: string): Promise<void> {
      expect(["a project", "the command's repository"]).toContain(where);
      delivered = { repository: where === "the command's repository", spec };
    },
    async stepAdapterHeldIn(spec: string, adapterFolder: string): Promise<void> {
      adapters.set(spec, adapterFolder);
    },
    async generationWritesTests(tests: string, spec: string): Promise<void> {
      written = Number(tests) > 0;
      if (!written) adapters.delete(spec);
    },
    async personsWordOn(spec: string, word: string): Promise<void> {
      if (word === "proved") vouched.push(spec);
      else expect(word).toBe("none");
    },
    async builtChangeOfPlatform(platform: string): Promise<void> {
      builtOn = platform;
      // A web product is a clean-react one; any other, the scratch project's backend.
      write(root, "factory.config.ts", platform === "web" ? 'export default { schema: "clean-react" };\n' : ONE_SCHEMA);
    },
    async wholeProductFailure(failure: string): Promise<void> {
      lastFailure = failure;
      const m = /^(\S+) names (\S+)$/.exec(failure);
      if (!m) return;
      write(root, m[2]!, "export const unused = 1;\n");
      wholeOutputs = [`${m[1]}: ${m[2]}`];
      if (failure.startsWith("the end-to-end test")) wholeOutputs = [];
    },
    async e2eTestResult(test: string, result: string): Promise<void> {
      e2eResults = [{ test, result: result === "passes" ? "passed" : "failed" }];
    },

    // Action
    async verifyChange(): Promise<void> {
      if (builtOn) {
        writeChange(root, CHANGE, {
          deltas: {},
          schema: builtOn === "web" ? "clean-react" : "clean-backend",
          parts: { phases: [true] },
        });
        const failingE2e = /^the end-to-end test (\S+) fails$/.exec(lastFailure)?.[1];
        evidence = await verify(root, CHANGE, {
          env: {},
          scenarios: async () => [],
          checks: async () => [],
          whole: async () => wholeOutputs,
          e2e: async () =>
            failingE2e ? [{ test: failingE2e, result: "failed" }] : builtOn === "web" ? e2eResults : [],
        });
        return;
      }
      if (delivered) {
        const { repository, spec } = delivered;
        writeChange(root, CHANGE, { deltas: { [spec]: delta() }, parts: { phases: [true] } });
        evidence = await verify(root, CHANGE, {
          env: {},
          checks: async () => [],
          whole: async () => [],
          e2e: async () => [],
          proved: vouched,
          layout: {
            repository,
            acceptance: "test/acceptance",
            adapterFolder: (of) => adapters.get(of),
          },
          tests: async (_, files) => {
            asked = files;
            return written
              ? files.map((name) => ({
                  name: join(root, name),
                  assertionResults: [
                    { ancestorTitles: ["Rule: An order is found"], title: "scenario 1", status: "passed" },
                  ],
                }))
              : [];
          },
        });
        return;
      }
      writeChange(root, CHANGE, {
        deltas: total ? { "orders/get-order": delta() } : {},
        parts: {
          phases: [true],
          procedures: tagged
            ? [
                block("Procedure", PROCEDURE, [
                  "@adds",
                  probedAs ? "@purpose:access" : "@purpose:operate",
                  "@topic:orders",
                  `@env:${tagged}`,
                  ...(probedAs ? [`@probed:${probedAs}`] : []),
                ]),
              ]
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
        whole: async () => [],
        e2e: async () => [],
        review: async () => lines,
        procedures:
          givenOutcome === undefined
            ? { [`${PROCEDURE}@local`]: "passed", [`${PROCEDURE}@sandbox`]: "passed" }
            : givenOutcome === "none"
              ? {}
              : { [`${PROCEDURE}@${tagged}`]: givenOutcome as "passed" | "failed" },
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
    async scenariosReadFromTest(test: string): Promise<void> {
      expect(asked).toEqual([test]);
      expect(evidence!.scenarios).toMatchObject([{ scenario: "scenario 1", result: "passed" }]);
    },
    async evidenceRecordsSpecAs(spec: string, proof: string): Promise<void> {
      const [recorded] = evidence!.scenarios.filter((s) => s.spec === spec);
      const text = readFileSync(join(root, "openspec/changes", CHANGE, "evidence.md"), "utf8");
      if (proof === "proved by the person's word") {
        expect(recorded).toMatchObject({ result: "passed", by: "the person" });
        expect(text).toContain("passed, by the person's word");
      } else {
        expect(proof).toBe("unproved");
        expect(recorded).toMatchObject({ result: "missing" });
        expect(text).not.toContain("by the person's word");
      }
    },
    async feedbackRaisedOn(raisedOn: string): Promise<void> {
      const names = raised(root, CHANGE).map((f) => f.names);
      if (raisedOn === "nothing") expect(names).toEqual([]);
      else expect(names).toEqual([raisedOn === "the change" ? CHANGE : raisedOn]);
    },
    async evidenceRecordsE2e(test: string, recorded: string): Promise<void> {
      expect(evidence!.e2e).toMatchObject([{ test, result: recorded }]);
      expect(readFileSync(join(root, "openspec/changes", CHANGE, "evidence.md"), "utf8")).toContain(
        `| ${test} | ${recorded} |`,
      );
    },
  };
}
