import { validateSchema } from "../../../shared/domain/schemas/validation.schema.ts";
import { StandardSchema, type StandardProps } from "../schemas/standard.schema.ts";
import type { StandardId } from "../schemas/standard-id.schema.ts";

export class StandardValueObject {
  readonly id!: StandardId;
  readonly title!: string;

  constructor(props: StandardProps) {
    validateSchema(this, StandardSchema, props);
  }
}
