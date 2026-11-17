import { z } from "zod";

export const DaySchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
export type Day = z.infer<typeof DaySchema>;
