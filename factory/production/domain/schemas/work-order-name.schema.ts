import { z } from "zod";

export const WorkOrderNameSchema = z.string().min(1);
export type WorkOrderName = z.infer<typeof WorkOrderNameSchema>;
