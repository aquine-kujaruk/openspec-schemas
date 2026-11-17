import { validateSchema } from "../../../shared/domain/schemas/validation.schema.ts";
import { WorkOrderNameSchema, type WorkOrderNameProps } from "../schemas/work-order-name.schema.ts";

export class WorkOrderName {
  readonly value!: string;

  constructor(props: WorkOrderNameProps) {
    validateSchema(this, WorkOrderNameSchema, props);
  }

  equals(other: WorkOrderName): boolean {
    return this.value === other.value;
  }
}
