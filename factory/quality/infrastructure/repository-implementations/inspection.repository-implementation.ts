import { InspectionRecordSchema, type InspectionAcl } from "../acl/inspection.acl.ts";
import type { LineName } from "../../../shared/domain/schemas/line-name.schema.ts";
import type { QualityControlRunRecord } from "../../domain/schemas/quality-control-run.schema.ts";
import type { InspectionRepositoryInterface } from "../../application/repository-interfaces/inspection.repository-interface.ts";

export class InspectionRepositoryImplementation implements InspectionRepositoryInterface {
  private readonly tool: InspectionAcl;

  constructor(tool: InspectionAcl) {
    this.tool = tool;
  }

  async inspectLine(line: LineName, scope: readonly string[]): Promise<QualityControlRunRecord> {
    return InspectionRecordSchema.parse(await this.tool.inspectLine(line, scope));
  }
}
