import { z } from "zod";

export const ScenarioResultSchema = z.object({
  spec: z.string(),
  requirement: z.string(),
  scenario: z.string(),
  result: z.enum(["passed", "failed", "missing"]),
  by: z.literal("the person").optional(),
});

export type ScenarioResultProps = z.input<typeof ScenarioResultSchema>;
