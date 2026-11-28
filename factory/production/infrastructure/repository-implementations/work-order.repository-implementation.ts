import type { WorkOrderRepositoryInterface } from "../../application/repository-interfaces/work-order.repository-interface.ts";
import type { WorkOrderAggregate } from "../../domain/aggregates/work-order.aggregate.ts";
import { WorkOrderException } from "../../domain/exceptions/work-order.exceptions.ts";
import type { WorkOrderName } from "../../domain/schemas/work-order-name.schema.ts";
import { WorkOrderRecordSchema, type WorkOrderAcl, type WorkOrderRecord } from "../acl/work-order.acl.ts";

export class WorkOrderRepositoryImplementation implements WorkOrderRepositoryInterface {
  private readonly files: WorkOrderAcl;

  constructor(files: WorkOrderAcl) {
    this.files = files;
  }

  async findWorkOrder(name: WorkOrderName): Promise<WorkOrderRecord | null> {
    try {
      const source = await this.files.readOrder(name);

      return source ? WorkOrderRecordSchema.parse(source) : null;
    } catch (cause) {
      throw new WorkOrderException(`Could not read work order ${name}`, { cause });
    }
  }

  async listWorkOrders(): Promise<WorkOrderRecord[]> {
    const names = await this.files.listOrders();
    const orders = await Promise.all(names.map((value) => this.findWorkOrder(value)));

    return orders.filter((order) => order !== null);
  }

  async saveWorkOrder(order: WorkOrderAggregate): Promise<void> {
    await this.files.writeRelease(order.name, order.plan.releasedOn);
  }
}
