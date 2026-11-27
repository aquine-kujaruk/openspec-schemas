import { z } from "zod";

export const ProcessNameSchema = z.string().min(1);
export type ProcessName = z.infer<typeof ProcessNameSchema>;
