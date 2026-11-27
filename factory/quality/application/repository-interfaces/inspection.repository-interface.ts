import type { LineName } from "../../../shared/domain/schemas/line-name.schema.ts";
import type { QualityControlRunAggregate } from "../../domain/aggregates/quality-control-run.aggregate.ts";

export interface InspectionRepositoryInterface {
  inspectLine(line: LineName, scope: readonly string[]): Promise<QualityControlRunAggregate>;
}
