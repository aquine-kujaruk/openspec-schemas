import { validateSchema } from "../../../shared/domain/schemas/validation.schema.ts";
import { StandardIdSchema, type StandardIdProps } from "../schemas/standard-id.schema.ts";

export class StandardId {
  readonly value!: string;

  constructor(props: StandardIdProps) {
    validateSchema(this, StandardIdSchema, props);
  }
}
