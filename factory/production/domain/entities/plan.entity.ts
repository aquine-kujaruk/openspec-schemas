import { validateSchema } from "../../../shared/domain/schemas/validation.schema.ts";
import { PlanSchema, type PlanProps } from "../schemas/plan.schema.ts";
import type { Day } from "../schemas/day.schema.ts";
import type { Decision } from "../value-objects/decision.value-object.ts";
import type { Stage } from "./stage.entity.ts";

export class Plan {
  readonly stages!: Stage[];
  readonly decisions!: Decision[];
  readonly openQuestions!: string[];
  readonly releasedOn?: Day;

  constructor(props: PlanProps) {
    validateSchema(this, PlanSchema, props);
  }
}
