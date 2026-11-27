import { z } from "zod";

/**
 * The fourth tool, `factory review`: the rows of the reviewer rubric judged by a decision
 * model. Harness configuration, the same for every developer; the key itself lives in `.env`.
 */
export const ReviewSchema = z.object({
  /** The `.env` variable that holds the decision model's API key. */
  keyVariable: z.string(),
  model: z.string(),
  /** A span whose probability is at or above this line is a warning (and keeps narrowing). */
  threshold: z.number(),
  /** A span at most this long is reported as it is; a longer one is split further. */
  spanLines: z.number(),
  /** Stage 1 caps: files per request and total characters per request. */
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
