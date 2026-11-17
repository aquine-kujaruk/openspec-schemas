import { validateSchema } from "../schemas/validation.schema.ts";
import { ProcessNameSchema, type ProcessNameProps } from "../schemas/process-name.schema.ts";

export class ProcessName {
  readonly value!: string;

  constructor(props: ProcessNameProps) {
    validateSchema(this, ProcessNameSchema, props);
  }

  equals(other: ProcessName): boolean {
    return this.value === other.value;
  }
}
