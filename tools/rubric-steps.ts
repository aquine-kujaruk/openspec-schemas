import { TestRunner } from "vitest";
import { assertRubricCase, judgements } from "../factory/sdk.ts";

type Score = Awaited<ReturnType<ReturnType<typeof judgements>["judge"]>>;
export type ReportedScore = Score & { layer: string; row: string; name: string };

export function createRubricSteps(layer: string, dir: string) {
  let reported: ReportedScore;
  return {
    async judge(row: string, name: string) {
      const score = await judgements(layer, dir).judge(row, name);
      reported = { layer, row, name, ...score };
      const test = TestRunner.getCurrentTest();
      if (test) Object.assign(test.meta, { rubricScore: reported });
    },
    check(verdict: string) {
      if (verdict !== "yes" && verdict !== "no") throw new Error(`Unknown expected verdict: ${verdict}`);
      assertRubricCase(layer, reported.row, reported.name, reported, verdict);
    },
  };
}
