import { validateSchema } from "../../../shared/domain/schemas/validation.schema.ts";
import { DecisionSchema, type DecisionProps } from "../schemas/decision.schema.ts";
import type { DecidedBy } from "../schemas/decision.schema.ts";

export class Decision {
  readonly text!: string;
  readonly by!: DecidedBy;

  constructor(props: DecisionProps) {
    validateSchema(this, DecisionSchema, props);
  }
}
