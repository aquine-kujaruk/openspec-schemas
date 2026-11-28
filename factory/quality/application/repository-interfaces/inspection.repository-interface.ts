import type { LineName } from "../../../shared/domain/schemas/line-name.schema.ts";
import type { QualityControlRunRecord } from "../../domain/schemas/quality-control-run.schema.ts";

export interface InspectionRepositoryInterface {
  inspectLine(line: LineName, scope: readonly string[]): Promise<QualityControlRunRecord>;
}
