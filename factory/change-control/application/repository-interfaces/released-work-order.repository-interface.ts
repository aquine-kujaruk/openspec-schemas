import type { ReleasedWorkOrder } from "../../domain/schemas/write-boundary.schema.ts";

export interface ReleasedWorkOrderRepositoryInterface {
  listReleasedWorkOrders(): Promise<ReleasedWorkOrder[]>;
}
