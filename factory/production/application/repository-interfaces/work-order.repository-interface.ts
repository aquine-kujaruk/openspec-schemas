import type { WorkOrder } from "../../domain/aggregates/work-order.aggregate.ts";
import type { WorkOrderName } from "../../domain/value-objects/work-order-name.value-object.ts";

export interface WorkOrderRepositoryInterface {
  findWorkOrder(name: WorkOrderName): Promise<WorkOrder | null>;
  listWorkOrders(): Promise<WorkOrder[]>;
  saveWorkOrder(order: WorkOrder): Promise<void>;
}
