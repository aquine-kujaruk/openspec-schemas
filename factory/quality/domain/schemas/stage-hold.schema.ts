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

export type BuildingStage = {
  name: string;
  process: string;
  line?: string;
  pendingFeedback?: boolean;
  phases: { title: string; tasks: { done: boolean; text?: string; workstream?: string }[] }[];
};

export type StageWorkstream = {
  id: string;
  upstream: string[];
  tests: ("unit" | "integration" | "acceptance")[];
};
