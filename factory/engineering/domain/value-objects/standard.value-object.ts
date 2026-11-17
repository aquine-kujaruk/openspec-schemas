import { validateSchema } from "../../../shared/domain/schemas/validation.schema.ts";
import { StandardSchema, type StandardProps } from "../schemas/standard.schema.ts";
import type { StandardId } from "../value-objects/standard-id.value-object.ts";

export class Standard {
  readonly id!: StandardId;
  readonly title!: string;

  constructor(props: StandardProps) {
    validateSchema(this, StandardSchema, props);
  }
}
