import { z } from "zod";
export const WorkOrderNameSchema = z.object({
  value: z.string().min(1),
});
export type WorkOrderNameProps = z.input<typeof WorkOrderNameSchema>;
