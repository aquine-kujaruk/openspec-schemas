import { z } from "zod";

export const StageHoldSchema = z.object({
  held: z.boolean(),
  reasons: z.array(z.string()),
});

export const StageRecordSchema = z.object({
  phase: z.string().optional(),
  failures: z.number(),
  waitingFor: z.enum(["the agent", "the person"]),
  findings: z.array(z.string()),
});

export type StageHoldProps = z.input<typeof StageHoldSchema>;
export type StageRecord = z.infer<typeof StageRecordSchema>;

export const BuildingStageSchema = z.object({
  name: z.string(),
  process: z.string(),
  line: z.string().optional(),
  pendingFeedback: z.boolean().optional(),
  phases: z.array(z.object({
    title: z.string(),
    tasks: z.array(z.object({ done: z.boolean(), text: z.string().optional(), workstream: z.string().optional() })),
  })),
});

export type BuildingStage = z.infer<typeof BuildingStageSchema>;

export type StageWorkstream = {
  id: string;
  upstream: string[];
  tests: ("unit" | "integration" | "acceptance")[];
};
