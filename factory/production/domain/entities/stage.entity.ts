import { validateSchema } from "../../../shared/domain/schemas/validation.schema.ts";
import { StageSchema, type StageProps } from "../schemas/stage.schema.ts";
import type { Operation } from "../value-objects/operation.value-object.ts";

export class Stage {
  readonly title!: string;
  readonly operations!: Operation[];

  constructor(props: StageProps) {
    validateSchema(this, StageSchema, props);
  }

  get complete(): boolean {
    return this.operations.every((operation) => operation.done);
  }
}
