import type { ReleasedWorkOrderRepositoryInterface } from "../../application/repository-interfaces/released-work-order.repository-interface.ts";
import { ChangeControlException } from "../../domain/exceptions/change-control.exceptions.ts";
import { ReleasedWorkOrderRecordSchema, type ReleasedWorkOrderAcl } from "../acl/released-work-order.acl.ts";

export class ReleasedWorkOrderRepositoryImplementation implements ReleasedWorkOrderRepositoryInterface {
  private readonly orders: ReleasedWorkOrderAcl;

  constructor(orders: ReleasedWorkOrderAcl) {
    this.orders = orders;
  }

  async listReleasedWorkOrders() {
    try {
      return ReleasedWorkOrderRecordSchema.array().parse(await this.orders.readStarted());
    } catch (cause) {
      throw new ChangeControlException("Unable to read the active work orders", { cause });
    }
  }
}
