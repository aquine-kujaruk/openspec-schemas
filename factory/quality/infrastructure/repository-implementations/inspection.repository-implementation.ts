import { InspectionRecordSchema, type InspectionAcl } from "../acl/inspection.acl.ts";
import type { LineName } from "../../../shared/domain/value-objects/line-name.value-object.ts";
import { QualityControlRun } from "../../domain/aggregates/quality-control-run.aggregate.ts";
import { Defect } from "../../domain/value-objects/defect.value-object.ts";
import type { InspectionRepositoryInterface } from "../../application/repository-interfaces/inspection.repository-interface.ts";

export class InspectionRepositoryImplementation implements InspectionRepositoryInterface {
  private readonly tool: InspectionAcl;

  constructor(tool: InspectionAcl) {
    this.tool = tool;
  }

  async inspectLine(line: LineName, scope: readonly string[]) {
    const result = InspectionRecordSchema.parse(await this.tool.inspectLine(line.value, scope));
    return new QualityControlRun({ exitStatus: result.exitStatus, defects: result.defects.map((defect) => new Defect(defect)) });
  }
}
