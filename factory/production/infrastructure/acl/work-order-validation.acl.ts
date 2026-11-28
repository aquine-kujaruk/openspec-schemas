import { z } from "zod";

export const WorkOrderFindingRecordSchema = z.object({ rule: z.string(), message: z.string() });

export const WorkOrderPlanRecordSchema = z.string().nullable();

export type WorkOrderValidationPort = {
  readPlan(name: string): Promise<unknown>;
  listFindings(name: string): Promise<unknown>;
};
