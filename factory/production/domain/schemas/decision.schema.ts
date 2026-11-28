import { z } from "zod";
export const DecidedBySchema = z.enum(["person", "agent"]);
export type DecidedBy = z.infer<typeof DecidedBySchema>;

export const DecisionSchema = z.object({
  text: z.string().min(1),
  by: DecidedBySchema,
});

export type DecisionProps = z.input<typeof DecisionSchema>;
