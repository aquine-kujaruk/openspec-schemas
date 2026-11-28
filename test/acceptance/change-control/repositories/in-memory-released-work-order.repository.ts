import type { ReleasedWorkOrderRepositoryInterface } from "../../../../factory/change-control/application/repository-interfaces/released-work-order.repository-interface.ts";
import type { ReleasedWorkOrder } from "../../../../factory/change-control/domain/schemas/write-boundary.schema.ts";

export class InMemoryReleasedWorkOrderRepository implements ReleasedWorkOrderRepositoryInterface {
  private started: ReleasedWorkOrder[] = [];
  reads = 0;

  seed(orders: ReleasedWorkOrder[]): void {
    this.started = orders;
  }

  async listReleasedWorkOrders(): Promise<ReleasedWorkOrder[]> {
    this.reads += 1;

    return this.started;
  }
}
