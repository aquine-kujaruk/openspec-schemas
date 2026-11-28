import { z } from "zod";

export const ReviewSchema = z.object({
  keyVariable: z.string(),
  model: z.string(),
  threshold: z.number(),
  spanLines: z.number(),
  batch: z.object({ files: z.number(), chars: z.number() }),
});

export type Review = z.infer<typeof ReviewSchema>;

export const DEFAULTS: Review = {
  keyVariable: "OPENAI_API_KEY",
  model: "gpt-6-luna",
  threshold: 0.85,
  spanLines: 40,
  batch: { files: 8, chars: 60_000 },
};
