import { z } from "zod";

export const ProcessNameSchema = z.object({
  value: z.string().min(1),
});
export type ProcessNameProps = z.infer<typeof ProcessNameSchema>;
