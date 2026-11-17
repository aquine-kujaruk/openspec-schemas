import { z } from "zod";
import { StandardId } from "../value-objects/standard-id.value-object.ts";

export const StandardSchema = z.object({
  id: z.instanceof(StandardId),
  title: z.string().min(1),
});
export type StandardProps = z.infer<typeof StandardSchema>;
