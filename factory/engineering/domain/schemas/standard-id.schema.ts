import { z } from "zod";

export const StandardIdSchema = z.object({
  value: z.string().min(1),
});
export type StandardIdProps = z.infer<typeof StandardIdSchema>;
