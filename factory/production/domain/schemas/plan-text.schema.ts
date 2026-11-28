import { z } from "zod";

export const PlanTextSchema = z.object({
  change: z.string().min(1),
  text: z.string(),
});

export const PlanFeedbackSchema = z.object({
  source: z.string(),
  says: z.string(),
  phase: z.number().int().optional(),
  questions: z.array(z.string()).optional(),
});

export type PlanTextProps = z.infer<typeof PlanTextSchema>;
export type PlanFeedback = z.infer<typeof PlanFeedbackSchema>;
