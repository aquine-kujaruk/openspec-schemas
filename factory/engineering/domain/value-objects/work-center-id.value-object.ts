import { validateSchema } from "../../../shared/domain/schemas/validation.schema.ts";
import { WorkCenterIdSchema, type WorkCenterIdProps } from "../schemas/work-center-id.schema.ts";

export class WorkCenterId {
  readonly value!: string;

  constructor(props: WorkCenterIdProps) {
    validateSchema(this, WorkCenterIdSchema, props);
  }
}
