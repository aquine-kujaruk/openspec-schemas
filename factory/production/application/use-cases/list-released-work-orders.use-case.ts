import type { WorkOrder } from "../../domain/aggregates/work-order.aggregate.ts";
import type { WorkOrderRepositoryInterface } from "../repository-interfaces/work-order.repository-interface.ts";

export class ListReleasedWorkOrdersUseCase {
  private readonly orders: WorkOrderRepositoryInterface;

  constructor(orders: WorkOrderRepositoryInterface) {
    this.orders = orders;
  }

  async execute(): Promise<WorkOrder[]> {
    return (await this.orders.listWorkOrders()).filter(({plan}) => plan.releasedOn && !plan.openQuestions.length);
  }
}
