import { createRubricSteps } from "../../../../tools/rubric-steps.ts";
import { basename, join } from "node:path";
import { expect } from "vitest";
import { architecture, exampleArchitecture } from "factory/sdk";
import { ruleIds } from "factory/sdk";
import { examples, type Findings } from "factory/sdk";
import { expectations } from "factory/sdk";

const layer = basename(import.meta.filename, ".feature.steps.ts");
const ex = examples(exampleArchitecture, import.meta.dirname, layer);
const recorded = expectations(join(import.meta.dirname, `${layer}.examples.md`));
const workstream = ruleIds(architecture, basename(import.meta.dirname));

export function createSteps() {
  const semantic = createRubricSteps(layer, import.meta.dirname);
  let current = "";
  let asked = "";
  let broken: Findings = new Map();
  let all: Record<string, string[]> = {};
  return {
    // Context
    async exampleFolder(example: string): Promise<void> {
      current = example;
    },

    // Action
    async ruleChecked(rule: string): Promise<void> {
      asked = rule;
      broken = await ex.violations(current, rule);
    },

    // Outcome
    async brokenAsExpected(): Promise<void> {
      recorded.check(current, asked, broken);
    },
  };
}
