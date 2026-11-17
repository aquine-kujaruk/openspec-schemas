import type { LineName } from "../../../shared/domain/value-objects/line-name.value-object.ts";
import type { QualityControlRun } from "../../domain/aggregates/quality-control-run.aggregate.ts";

import type { InspectionRepositoryInterface } from "../repository-interfaces/inspection.repository-interface.ts";

export class RunQualityControlUseCase {
  private readonly repository: InspectionRepositoryInterface;

  constructor(repository: InspectionRepositoryInterface) {
    this.repository = repository;
  }

  execute(line: LineName, scope: readonly string[]): Promise<QualityControlRun> {
    return this.repository.inspectLine(line, scope);
  }
}
