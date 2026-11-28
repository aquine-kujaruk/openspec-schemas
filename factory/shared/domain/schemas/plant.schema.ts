import { z } from "zod";
import { LineEntity } from "../entities/line.entity.ts";
import { LineNameSchema } from "./line-name.schema.ts";
import { LineRootsSchema } from "./line-roots.schema.ts";
import { ProcessNameSchema } from "./process-name.schema.ts";

export const PlantSchema = z.object({
  root: z.string().min(1),
  lines: z.array(z.instanceof(LineEntity)),
});

export const PlantRecordSchema = z.object({
  root: z.string().min(1),
  lines: z.array(z.object({
    name: LineNameSchema,
    folder: z.string().min(1),
    process: ProcessNameSchema,
    roots: LineRootsSchema,
  })),
});

export type PlantProps = z.infer<typeof PlantSchema>;
export type PlantRecord = z.infer<typeof PlantRecordSchema>;
