import { basename, join } from "node:path";
import { expect } from "vitest";
import { architecture, exampleArchitecture } from "../../../../toolkit/architecture/project.ts";
import { ruleIds } from "../../../../toolkit/architecture/rules.ts";
import { examples, type Findings } from "../../../../toolkit/architecture/examples.ts";
import { expectations } from "../../../../toolkit/architecture/expectations.ts";

const layer = basename(import.meta.filename, ".feature.steps.ts");
const ex = examples(exampleArchitecture, import.meta.dirname, layer);
const recorded = expectations(join(import.meta.dirname, `${layer}.examples.md`));
const workstream = ruleIds(architecture, basename(import.meta.dirname));

export function createSteps() {
  let current = "";
  let asked = "";
  let broken: Findings = new Map();
  let all: Record<string, string[]> = {};
  return {
    // Context
    async exampleFolder(example: string): Promise<void> {
      current = example;
    },
    async referenceFolder(): Promise<void> {
      current = "reference";
    },

    // Action
    async ruleChecked(rule: string): Promise<void> {
      asked = rule;
      broken = await ex.violations(current, rule);
    },
    async workstreamChecked(): Promise<void> {
      all = await ex.all(current, workstream);
    },

    // Outcome
    async brokenAsExpected(): Promise<void> {
      recorded.check(current, asked, broken);
    },
    async noBrokenFiles(): Promise<void> {
      expect(all, `${current}`).toEqual({});
    },
  };
}
