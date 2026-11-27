import { z } from "zod";
import { ProcessNameSchema } from "../../../shared/domain/schemas/process-name.schema.ts";
import { WorkCenterIdSchema } from "../schemas/work-center-id.schema.ts";
import { WorkCenterEntity } from "../entities/work-center.entity.ts";

export const ProcessSchema = z.object({
  name: ProcessNameSchema,
  base: ProcessNameSchema.optional(),
  description: z.string().optional(),
  pilot: WorkCenterIdSchema.optional(),
  workCenters: z.array(z.instanceof(WorkCenterEntity)),
});
export type ProcessProps = z.infer<typeof ProcessSchema>;
