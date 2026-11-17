import { z } from "zod";
import { Stage } from "../entities/stage.entity.ts";
import { Decision } from "../value-objects/decision.value-object.ts";
import { DaySchema } from "./day.schema.ts";

export const PlanSchema = z.object({
  stages: z.array(z.instanceof(Stage)),
  decisions: z.array(z.instanceof(Decision)).default([]),
  openQuestions: z.array(z.string()).default([]),
  releasedOn: DaySchema.optional(),
});
export type PlanProps = z.input<typeof PlanSchema>;
