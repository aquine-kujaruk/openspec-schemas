import type { WorkOrderAggregate } from "../../domain/aggregates/work-order.aggregate.ts";
import type { WorkOrderName } from "../../domain/schemas/work-order-name.schema.ts";

export interface WorkOrderRepositoryInterface {
  findWorkOrder(name: WorkOrderName): Promise<WorkOrderAggregate | null>;
  listWorkOrders(): Promise<WorkOrderAggregate[]>;
  saveWorkOrder(order: WorkOrderAggregate): Promise<void>;
}
