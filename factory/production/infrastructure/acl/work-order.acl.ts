
export { WorkOrderRecordSchema } from "../../domain/schemas/work-order.schema.ts";
import type { WorkOrderRecord } from "../../domain/schemas/work-order.schema.ts";

export type { WorkOrderRecord };

export interface WorkOrderAcl {
  readOrder(name: string): Promise<WorkOrderRecord | null>;
  listOrders(): Promise<string[]>;
  writeRelease(name: string, day: string | undefined): Promise<void>;
}
