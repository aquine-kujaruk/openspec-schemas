import { z } from "zod";
import { LineName } from "../../../shared/domain/value-objects/line-name.value-object.ts";
import { ProcessName } from "../../../shared/domain/value-objects/process-name.value-object.ts";
import { Plan } from "../entities/plan.entity.ts";
import { AndonPull } from "../value-objects/andon-pull.value-object.ts";
import { DrawingRevision } from "../value-objects/drawing-revision.value-object.ts";
import { WorkOrderName } from "../value-objects/work-order-name.value-object.ts";

export const WorkOrderSchema = z.object({
  name: z.instanceof(WorkOrderName),
  process: z.instanceof(ProcessName),
  line: z.instanceof(LineName).optional(),
  plan: z.instanceof(Plan),
  revisions: z.array(z.instanceof(DrawingRevision)).default([]),
  andonPulls: z.array(z.instanceof(AndonPull)).default([]),
}).transform(({ plan, ...order }) => ({ ...order, currentPlan: plan }));
export type WorkOrderProps = z.input<typeof WorkOrderSchema>;
