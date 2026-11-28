import { z } from "zod";

export type BuildingRecord = {
  name: string;
  process: string;
  line?: string;
  pendingFeedback?: boolean;
  phases: { title: string; tasks: { done: boolean; text?: string; workstream?: string }[] }[];
};

export type WorkstreamRecord = {
  id: string;
  upstream: string[];
  tests: ("unit" | "integration" | "acceptance")[];
};

export const GateRecordSchema = z.object({
  phase: z.string().optional(),
  failures: z.number(),
  waitingFor: z.enum(["the agent", "the person"]),
  findings: z.array(z.string()),
});

export type GateRecord = z.infer<typeof GateRecordSchema>;

export interface StageHoldAcl {
  buildingRecords(): Promise<BuildingRecord[]>;
  hasCurrentVerification(name: string): Promise<boolean>;
  harnessFindings(): Promise<string[]>;
  workstreams(stage: BuildingRecord): Promise<WorkstreamRecord[]>;
  readRecord(name: string): Promise<unknown>;
  writeRecord(name: string, record: GateRecord): Promise<void>;
  removeRecord(name: string): Promise<void>;
  run(stage: BuildingRecord, args: string[]): Promise<{ status: number | null; output: string }>;
}
