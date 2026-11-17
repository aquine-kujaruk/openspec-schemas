import { z } from "zod";
import { Line } from "../entities/line.entity.ts";

export const PlantSchema = z.object({
  root: z.string().min(1),
  lines: z.array(z.instanceof(Line)),
});
export type PlantProps = z.infer<typeof PlantSchema>;
