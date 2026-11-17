import { validateSchema } from "../../../shared/domain/schemas/validation.schema.ts";
import { WorkCenterSchema, type WorkCenterProps } from "../schemas/work-center.schema.ts";
import type { WorkCenterId } from "../value-objects/work-center-id.value-object.ts";
import type { Part } from "../value-objects/part.value-object.ts";

export class WorkCenter {
  readonly id!: WorkCenterId;
  readonly parts!: Part[];
  readonly waitsFor!: WorkCenterId[];

  constructor(props: WorkCenterProps) {
    validateSchema(this, WorkCenterSchema, props);
  }
}
