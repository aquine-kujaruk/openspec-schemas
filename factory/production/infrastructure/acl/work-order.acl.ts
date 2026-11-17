import { z } from "zod";

export const WorkOrderRecordSchema = z.object({
  name: z.string(),
  process: z.string(),
  line: z.string().optional(),
  plan: z.string(),
  revisions: z.array(z.object({ drawing: z.string(), document: z.string() })),
  andon: z.array(z.object({ from: z.string(), names: z.string(), says: z.string() })),
});

export type WorkOrderRecord = z.infer<typeof WorkOrderRecordSchema>;

export interface WorkOrderAcl {
  readOrder(name: string): Promise<WorkOrderRecord | null>;
  listOrders(): Promise<string[]>;
  writeRelease(name: string, day: string | undefined): Promise<void>;
}
