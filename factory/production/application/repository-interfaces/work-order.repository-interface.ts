import type { WorkOrderAggregate } from "../../domain/aggregates/work-order.aggregate.ts";
import type { WorkOrderName } from "../../domain/schemas/work-order-name.schema.ts";
import type { WorkOrderRecord } from "../../domain/schemas/work-order.schema.ts";

export interface WorkOrderRepositoryInterface {
  findWorkOrder(name: WorkOrderName): Promise<WorkOrderRecord | null>;
  listWorkOrders(): Promise<WorkOrderRecord[]>;
  saveWorkOrder(order: WorkOrderAggregate): Promise<void>;
}
