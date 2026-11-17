import type { WorkOrderProcess } from "../../application/repository-interfaces/work-order-assessment.repository-interface.ts";

export interface WorkOrderAssessmentAcl {
  listProcesses(): string[];
  loadProcess(name: string): Promise<WorkOrderProcess>;
  listProducts(root: string): Promise<Record<string, { schema: string }>>;
}
