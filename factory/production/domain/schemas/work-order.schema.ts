import { z } from "zod";
import { LineNameSchema } from "../../../shared/domain/schemas/line-name.schema.ts";
import { ProcessNameSchema } from "../../../shared/domain/schemas/process-name.schema.ts";
import { PlanEntity } from "../entities/plan.entity.ts";
import { AndonPullValueObject } from "../value-objects/andon-pull.value-object.ts";
import { DrawingRevisionValueObject } from "../value-objects/drawing-revision.value-object.ts";
import { WorkOrderNameSchema } from "../schemas/work-order-name.schema.ts";

export const WorkOrderSchema = z.object({
  name: WorkOrderNameSchema,
  process: ProcessNameSchema,
  line: LineNameSchema.optional(),
  plan: z.instanceof(PlanEntity),
  revisions: z.array(z.instanceof(DrawingRevisionValueObject)).default([]),
  andonPulls: z.array(z.instanceof(AndonPullValueObject)).default([]),
}).transform(({ plan, ...order }) => ({ ...order, currentPlan: plan }));
export type WorkOrderProps = z.input<typeof WorkOrderSchema>;
