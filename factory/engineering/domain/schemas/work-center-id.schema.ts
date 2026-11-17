import { z } from "zod";

export const WorkCenterIdSchema = z.object({
  value: z.string().min(1),
});
export type WorkCenterIdProps = z.infer<typeof WorkCenterIdSchema>;
