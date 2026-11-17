import type { WorkOrderValidationAcl } from "../acl/work-order-validation.acl.ts";

export class WorkOrderValidationAdapter implements WorkOrderValidationAcl {
  private readonly read: WorkOrderValidationAcl["readPlan"];
  private readonly findings: WorkOrderValidationAcl["listFindings"];

  constructor(read: WorkOrderValidationAcl["readPlan"], findings: WorkOrderValidationAcl["listFindings"]) {
    this.read = read;
    this.findings = findings;
  }

  readPlan(name: string) { return this.read(name); }
  listFindings(name: string) { return this.findings(name); }
}
