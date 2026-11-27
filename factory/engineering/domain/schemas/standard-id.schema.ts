import { z } from "zod";

export const StandardIdSchema = z.string().min(1);
export type StandardId = z.infer<typeof StandardIdSchema>;
