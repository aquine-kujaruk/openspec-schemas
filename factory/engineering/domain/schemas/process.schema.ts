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

export const ProcessRecordSchema = z.object({
  name: z.string(),
  base: z.string().optional(),
  description: z.string(),
  pilot: z.string().optional(),
  workCenters: z.array(z.object({
    id: z.string(),
    waitsFor: z.array(z.string()),
    parts: z.array(z.object({
      name: z.string(),
      standards: z.array(z.object({ id: z.string(), title: z.string() })),
    })),
  })),
});

export type ProcessProps = z.infer<typeof ProcessSchema>;
export type ProcessRecord = z.infer<typeof ProcessRecordSchema>;
