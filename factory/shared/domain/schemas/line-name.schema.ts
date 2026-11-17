import { z } from "zod";

export const LineNameSchema = z.object({
  value: z.string(),
});
export type LineNameProps = z.infer<typeof LineNameSchema>;
