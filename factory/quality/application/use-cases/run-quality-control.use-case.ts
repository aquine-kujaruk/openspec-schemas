import type { LineName } from "../../../shared/domain/schemas/line-name.schema.ts";
import type { QualityControlRunAggregate } from "../../domain/aggregates/quality-control-run.aggregate.ts";

import type { InspectionRepositoryInterface } from "../repository-interfaces/inspection.repository-interface.ts";

export class RunQualityControlUseCase {
  private readonly repository: InspectionRepositoryInterface;

  constructor(repository: InspectionRepositoryInterface) {
    this.repository = repository;
  }

  execute(line: LineName, scope: readonly string[]): Promise<QualityControlRunAggregate> {
    return this.repository.inspectLine(line, scope);
  }
}
