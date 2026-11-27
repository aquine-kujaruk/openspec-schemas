import { z } from "zod";

export const WorkCenterIdSchema = z.string().min(1);
export type WorkCenterId = z.infer<typeof WorkCenterIdSchema>;
