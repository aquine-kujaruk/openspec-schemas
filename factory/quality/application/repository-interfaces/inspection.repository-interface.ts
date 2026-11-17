import type { LineName } from "../../../shared/domain/value-objects/line-name.value-object.ts";
import type { QualityControlRun } from "../../domain/aggregates/quality-control-run.aggregate.ts";

export interface InspectionRepositoryInterface {
  inspectLine(line: LineName, scope: readonly string[]): Promise<QualityControlRun>;
}
