import { validateSchema } from "../../../shared/domain/schemas/validation.schema.ts";
import { PartSchema, type PartProps } from "../schemas/part.schema.ts";
import type { Standard } from "../value-objects/standard.value-object.ts";

export class Part {
  readonly name!: string;
  readonly standards!: Standard[];

  constructor(props: PartProps) {
    validateSchema(this, PartSchema, props);
  }
}
