import type { LineName } from "../../../shared/domain/schemas/line-name.schema.ts";
import { QualityControlRunAggregate } from "../../domain/aggregates/quality-control-run.aggregate.ts";

import type { InspectionRepositoryInterface } from "../repository-interfaces/inspection.repository-interface.ts";

export class RunQualityControlUseCase {
  private readonly repository: InspectionRepositoryInterface;

  constructor(repository: InspectionRepositoryInterface) {
    this.repository = repository;
  }

  async execute(line: LineName, scope: readonly string[]): Promise<QualityControlRunAggregate> {
    return QualityControlRunAggregate.from(await this.repository.inspectLine(line, scope));
  }
}
