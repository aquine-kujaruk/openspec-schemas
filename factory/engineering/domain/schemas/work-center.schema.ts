import { z } from "zod";
import { WorkCenterId } from "../value-objects/work-center-id.value-object.ts";
import { Part } from "../value-objects/part.value-object.ts";

export const WorkCenterSchema = z.object({
  id: z.instanceof(WorkCenterId),
  parts: z.array(z.instanceof(Part)),
  waitsFor: z.array(z.instanceof(WorkCenterId)),
});
export type WorkCenterProps = z.infer<typeof WorkCenterSchema>;
