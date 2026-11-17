import { z } from "zod";
export const AndonPullSchema = z.object({
  from: z.string(),
  names: z.string(),
  says: z.string(),
});
export type AndonPullProps = z.input<typeof AndonPullSchema>;
