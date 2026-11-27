import { validateSchema } from "../../../shared/domain/schemas/validation.schema.ts";
import { MaintenanceReportSchema, type MaintenanceReportProps } from "../schemas/maintenance-report.schema.ts";
import type { MaintenanceItemValueObject } from "../value-objects/maintenance-item.value-object.ts";

export class MaintenanceReportAggregate {
  readonly items!: MaintenanceItemValueObject[];

  constructor(props: MaintenanceReportProps) {
    validateSchema(this, MaintenanceReportSchema, props);
  }

  get status(): 0 | 1 {
    return this.items.some((item) => item.isLack && !item.repaired) ? 1 : 0;
  }
}
