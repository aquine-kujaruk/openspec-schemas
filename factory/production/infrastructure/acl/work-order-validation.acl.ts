export interface WorkOrderValidationAcl {
  readPlan(name: string): Promise<string | null>;
  listFindings(name: string): Promise<{rule: string; message: string}[]>;
}
