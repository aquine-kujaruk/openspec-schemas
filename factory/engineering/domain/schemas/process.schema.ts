import { z } from "zod";
import { ProcessName } from "../../../shared/domain/value-objects/process-name.value-object.ts";
import { WorkCenterId } from "../value-objects/work-center-id.value-object.ts";
import { WorkCenter } from "../entities/work-center.entity.ts";

export const ProcessSchema = z.object({
  name: z.instanceof(ProcessName),
  base: z.instanceof(ProcessName).optional(),
  description: z.string().optional(),
  pilot: z.instanceof(WorkCenterId).optional(),
  workCenters: z.array(z.instanceof(WorkCenter)),
});
export type ProcessProps = z.infer<typeof ProcessSchema>;
