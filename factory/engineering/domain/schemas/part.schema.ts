import { z } from "zod";
import { StandardValueObject } from "../value-objects/standard.value-object.ts";

export const PartSchema = z.object({
  name: z.string().min(1),
  standards: z.array(z.instanceof(StandardValueObject)),
});

export type PartProps = z.infer<typeof PartSchema>;
