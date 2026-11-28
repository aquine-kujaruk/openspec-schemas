import { InspectionRecordSchema, type InspectionAcl } from "../acl/inspection.acl.ts";
import type { LineName } from "../../../shared/domain/schemas/line-name.schema.ts";
import { QualityControlRunAggregate } from "../../domain/aggregates/quality-control-run.aggregate.ts";
import { DefectValueObject } from "../../domain/value-objects/defect.value-object.ts";
import type { InspectionRepositoryInterface } from "../../application/repository-interfaces/inspection.repository-interface.ts";

export class InspectionRepositoryImplementation implements InspectionRepositoryInterface {
  private readonly tool: InspectionAcl;

  constructor(tool: InspectionAcl) {
    this.tool = tool;
  }

  async inspectLine(line: LineName, scope: readonly string[]) {
    const result = InspectionRecordSchema.parse(await this.tool.inspectLine(line, scope));

    return new QualityControlRunAggregate({ exitStatus: result.exitStatus, defects: result.defects.map((defect) => new DefectValueObject(defect)) });
  }
}
