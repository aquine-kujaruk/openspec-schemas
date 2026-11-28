import type { ReleasedWorkOrderRepositoryInterface } from "../../application/repository-interfaces/released-work-order.repository-interface.ts";
import { ChangeControlException } from "../../domain/exceptions/change-control.exceptions.ts";
import { ReleasedWorkOrderRecordSchema, type ReleasedWorkOrderPort } from "../acl/released-work-order.acl.ts";

export class ReleasedWorkOrderRepositoryImplementation implements ReleasedWorkOrderRepositoryInterface {
  private readonly readStarted: ReleasedWorkOrderPort;

  constructor(readStarted: ReleasedWorkOrderPort) {
    this.readStarted = readStarted;
  }

  async listReleasedWorkOrders() {
    try {
      return ReleasedWorkOrderRecordSchema.array().parse(await this.readStarted());
    } catch (cause) {
      throw new ChangeControlException("Unable to read the active work orders", { cause });
    }
  }
}
