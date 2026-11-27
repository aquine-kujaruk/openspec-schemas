import { validateSchema } from "../../../shared/domain/schemas/validation.schema.ts";
import { WorkCenterSchema, type WorkCenterProps } from "../schemas/work-center.schema.ts";
import type { WorkCenterId } from "../schemas/work-center-id.schema.ts";
import type { PartValueObject } from "../value-objects/part.value-object.ts";

export class WorkCenterEntity {
  readonly id!: WorkCenterId;
  readonly parts!: PartValueObject[];
  readonly waitsFor!: WorkCenterId[];

  constructor(props: WorkCenterProps) {
    validateSchema(this, WorkCenterSchema, props);
  }
}
