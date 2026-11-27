import { validateSchema } from "../../../shared/domain/schemas/validation.schema.ts";
import { StageSchema, type StageProps } from "../schemas/stage.schema.ts";
import type { OperationValueObject } from "../value-objects/operation.value-object.ts";

export class StageEntity {
  readonly title!: string;
  readonly operations!: OperationValueObject[];

  constructor(props: StageProps) {
    validateSchema(this, StageSchema, props);
  }

  get complete(): boolean {
    return this.operations.every((operation) => operation.done);
  }
}
