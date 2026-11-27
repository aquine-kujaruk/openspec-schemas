import { z } from "zod";

export const LineNameSchema = z.string();
export type LineName = z.infer<typeof LineNameSchema>;
