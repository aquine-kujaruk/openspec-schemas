import { createRubricSteps } from "../../../../../../tools/rubric-steps.ts";
import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { basename, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { expect } from "vitest";
import { architecture, exampleArchitecture } from "factory/sdk";
import { ruleIds } from "factory/sdk";
import { examples, type Findings } from "factory/sdk";
import { expectations } from "factory/sdk";

const layer = basename(import.meta.filename, ".feature.steps.ts");
const ex = examples(exampleArchitecture, import.meta.dirname, layer);
const recorded = expectations(join(import.meta.dirname, `${layer}.examples.md`));
const workstream = ruleIds(architecture, basename(import.meta.dirname));

const CLI = fileURLToPath(new URL("../../../../../../factory/main.ts", import.meta.url));

export function createSteps() {
  const semantic = createRubricSteps(layer, import.meta.dirname);
  let current = "";
  let asked = "";
  let broken: Findings = new Map();
  let all: Record<string, string[]> = {};
  let fixture: string;
  let scopeStatus: number | null;
  let scopeOutput = "";

  const write = (file: string, contents: string): void => {
    const path = join(fixture, file);
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, contents);
  };

  return {
    // Context
    async exampleFolder(example: string): Promise<void> {
      current = example;
    },
    async referenceFolder(): Promise<void> {
      current = "reference";
    },
    anotherModuleHasFinding(): void {
      fixture = mkdtempSync(join(tmpdir(), "module-scope-"));
      write("package.json", '{"name":"module-scope","type":"module"}');
      write("tsconfig.json", '{"compilerOptions":{"module":"nodenext"},"include":["factory"]}');
      write("factory.config.ts", 'export default { schema: "clean-backend", modules: "factory/*", entry: ["factory/main.ts"] };');
      write("factory/main.ts", 'import { isReady } from "./production/domain/schemas/work-order.schema.ts"; console.log(isReady({ status: "ready" }));');
      write("factory/shared/domain/schemas/status.schema.ts", 'export type Status = { status: string };\nexport const StatusSchema = { keys: ["status"] };');
      write("factory/production/domain/schemas/work-order.schema.ts", `
import type { Status } from "../../../shared/domain/schemas/status.schema.ts";
export const WorkOrderSchema = { keys: ["status"] };
export const isReady = (value: Status) => value.status === "ready";
`);
    },
    lineHasUnusedFile(): void {
      write("factory/production/domain/schemas/unreached.schema.ts", 'export const LegacySchema = { keys: ["unreached"] };');
    },

    // Action
    async ruleChecked(rule: string): Promise<void> {
      asked = rule;
      broken = await ex.violations(current, rule);
    },
    async workstreamChecked(): Promise<void> {
      all = await ex.all(current, workstream);
    },
    moduleScopeChecked(scope: string): void {
      const args = scope === "whole line" ? [] : ["--module", scope];
      const result = spawnSync(process.execPath, [CLI, "check", ...args], {
        cwd: fixture, encoding: "utf8",
      });
      scopeStatus = result.status;
      scopeOutput = result.stdout + result.stderr;
    },
    async rubricJudged(row: string): Promise<void> {
      await semantic.judge(row, current);
    },

    // Outcome
    async brokenAsExpected(): Promise<void> {
      recorded.check(current, asked, broken);
    },
    async noBrokenFiles(): Promise<void> {
      expect(all, `${current}`).toEqual({});
    },
    async moduleScopeOutcome(outcome: string): Promise<void> {
      try {
        const ruled = outcome !== "neither the rule violation nor the unused file";
        const unused = outcome === "the rule violation and the unused file";
        expect(scopeStatus, scopeOutput).toBe(ruled ? 1 : 0);
        expect(scopeOutput.includes("[no-magic-closed-set-strings]"), scopeOutput).toBe(ruled);
        expect(scopeOutput.includes("unreached.schema.ts"), scopeOutput).toBe(unused);
      } finally {
        rmSync(fixture, { recursive: true, force: true });
      }
    },
    rubricVerdict(verdict: string): void {
      semantic.check(verdict);
    },
  };
}
