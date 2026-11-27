import { z } from "zod";
import { StageEntity } from "../entities/stage.entity.ts";
import { DecisionValueObject } from "../value-objects/decision.value-object.ts";
import { DaySchema } from "./day.schema.ts";

export const PlanSchema = z.object({
  stages: z.array(z.instanceof(StageEntity)),
  decisions: z.array(z.instanceof(DecisionValueObject)).default([]),
  openQuestions: z.array(z.string()).default([]),
  releasedOn: DaySchema.optional(),
});
export type PlanProps = z.input<typeof PlanSchema>;
