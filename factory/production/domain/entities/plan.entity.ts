import { validateSchema } from "../../../shared/domain/schemas/validation.schema.ts";
import { PlanSchema, type PlanProps } from "../schemas/plan.schema.ts";
import type { Day } from "../schemas/day.schema.ts";
import type { DecisionValueObject } from "../value-objects/decision.value-object.ts";
import type { StageEntity } from "./stage.entity.ts";

export class PlanEntity {
  readonly stages!: StageEntity[];
  readonly decisions!: DecisionValueObject[];
  readonly openQuestions!: string[];
  readonly releasedOn?: Day;

  constructor(props: PlanProps) {
    validateSchema(this, PlanSchema, props);
  }
}
