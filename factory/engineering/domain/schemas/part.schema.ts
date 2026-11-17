import { z } from "zod";
import { Standard } from "../value-objects/standard.value-object.ts";

export const PartSchema = z.object({
  name: z.string().min(1),
  standards: z.array(z.instanceof(Standard)),
});
export type PartProps = z.infer<typeof PartSchema>;
