import { z } from "zod";
import { WorkCenterIdSchema } from "../schemas/work-center-id.schema.ts";
import { PartValueObject } from "../value-objects/part.value-object.ts";

export const WorkCenterSchema = z.object({
  id: WorkCenterIdSchema,
  parts: z.array(z.instanceof(PartValueObject)),
  waitsFor: z.array(WorkCenterIdSchema),
});
export type WorkCenterProps = z.infer<typeof WorkCenterSchema>;
