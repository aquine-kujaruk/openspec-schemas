import type { WorkOrderValidationRepositoryInterface } from "../../application/repository-interfaces/work-order-validation.repository-interface.ts";
import type { WorkOrderValidationAcl } from "../acl/work-order-validation.acl.ts";

export class WorkOrderValidationRepositoryImplementation implements WorkOrderValidationRepositoryInterface {
  private readonly documents: WorkOrderValidationAcl;

  constructor(documents: WorkOrderValidationAcl) {
    this.documents = documents;
  }

  readPlan(name: string) { return this.documents.readPlan(name); }
  listFindings(name: string) { return this.documents.listFindings(name); }
}
