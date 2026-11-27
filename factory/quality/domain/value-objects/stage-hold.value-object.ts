import { validateSchema } from "../../../shared/domain/schemas/validation.schema.ts";
import { StageHoldSchema, type StageHoldProps } from "../schemas/stage-hold.schema.ts";

export class StageHoldValueObject {
  readonly held!: boolean;
  readonly reasons!: string[];

  constructor(props: StageHoldProps) {
    validateSchema(this, StageHoldSchema, props);
  }

  get allowed(): boolean {
    return !this.held;
  }
}
