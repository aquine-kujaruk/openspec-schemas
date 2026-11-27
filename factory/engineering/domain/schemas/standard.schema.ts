import { z } from "zod";
import { StandardIdSchema } from "../schemas/standard-id.schema.ts";

export const StandardSchema = z.object({
  id: StandardIdSchema,
  title: z.string().min(1),
});
export type StandardProps = z.infer<typeof StandardSchema>;
