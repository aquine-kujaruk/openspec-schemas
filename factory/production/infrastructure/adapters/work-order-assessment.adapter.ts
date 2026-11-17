import type { WorkOrderProcess } from "../../application/repository-interfaces/work-order-assessment.repository-interface.ts";
import type { WorkOrderAssessmentAcl } from "../acl/work-order-assessment.acl.ts";

type ProcessCatalog = {
  schemaNames(): string[];
  loadSchema(name: string): Promise<{
    validator: WorkOrderProcess["validator"];
    definition: { workstreams: string[]; spike?: { workstream: string } };
  }>;
  readProjectConfig(root: string): Promise<{ products?: Record<string, { schema: string }> } | undefined>;
};

export class WorkOrderAssessmentAdapter implements WorkOrderAssessmentAcl {
  private readonly catalog: ProcessCatalog;

  constructor(catalog: ProcessCatalog) {
    this.catalog = catalog;
  }

  listProcesses() { return this.catalog.schemaNames(); }

  async loadProcess(name: string): Promise<WorkOrderProcess> {
    const { definition, validator } = await this.catalog.loadSchema(name);
    return { validator, workstreams: definition.workstreams, spike: definition.spike?.workstream };
  }

  async listProducts(root: string) {
    return (await this.catalog.readProjectConfig(root))?.products ?? {};
  }
}
