import { validateSchema } from "../../../shared/domain/schemas/validation.schema.ts";
import { PartSchema, type PartProps } from "../schemas/part.schema.ts";
import type { StandardValueObject } from "../value-objects/standard.value-object.ts";

export class PartValueObject {
  readonly name!: string;
  readonly standards!: StandardValueObject[];

  constructor(props: PartProps) {
    validateSchema(this, PartSchema, props);
  }
}
