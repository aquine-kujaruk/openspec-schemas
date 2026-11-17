import { z } from "zod";

export const ReleasedWorkOrderRecordSchema = z.object({
  name: z.string(),
  process: z.string(),
  builds: z.boolean(),
  line: z.string().optional(),
});

export type ReleasedWorkOrderRecord = z.infer<typeof ReleasedWorkOrderRecordSchema>;

export interface ReleasedWorkOrderAcl {
  readStarted(): Promise<ReleasedWorkOrderRecord[]>;
}
