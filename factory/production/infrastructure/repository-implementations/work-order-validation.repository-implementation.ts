import type { WorkOrderValidationRepositoryInterface } from "../../application/repository-interfaces/work-order-validation.repository-interface.ts";
import { WorkOrderFindingRecordSchema, WorkOrderPlanRecordSchema, type WorkOrderValidationPort } from "../acl/work-order-validation.acl.ts";

export class WorkOrderValidationRepositoryImplementation implements WorkOrderValidationRepositoryInterface {
  private readonly documents: WorkOrderValidationPort;

  constructor(documents: WorkOrderValidationPort) {
    this.documents = documents;
  }

  async readPlan(name: string): Promise<string | null> {
    return WorkOrderPlanRecordSchema.parse(await this.documents.readPlan(name));
  }

  async listFindings(name: string): Promise<Array<{ rule: string; message: string }>> {
    return WorkOrderFindingRecordSchema.array().parse(await this.documents.listFindings(name));
  }
}
