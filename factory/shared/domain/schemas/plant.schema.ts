import { z } from "zod";
import { LineEntity } from "../entities/line.entity.ts";

export const PlantSchema = z.object({
  root: z.string().min(1),
  lines: z.array(z.instanceof(LineEntity)),
});

export type PlantProps = z.infer<typeof PlantSchema>;
