import { validateSchema } from "../../../shared/domain/schemas/validation.schema.ts";
import { OperationSchema, type OperationProps } from "../schemas/operation.schema.ts";
import type { WorkCenterId } from "../schemas/operation.schema.ts";

export class Operation {
  readonly workCenter?: WorkCenterId;
  readonly text!: string;
  readonly done!: boolean;

  constructor(props: OperationProps) {
    validateSchema(this, OperationSchema, props);
  }
}
