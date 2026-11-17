import { validateSchema } from "../schemas/validation.schema.ts";
import { LineNameSchema, type LineNameProps } from "../schemas/line-name.schema.ts";

export class LineName {
  readonly value!: string;

  constructor(props: LineNameProps) {
    validateSchema(this, LineNameSchema, props);
  }

  equals(other: LineName): boolean {
    return this.value === other.value;
  }
}
