import type { Review } from "../../../shared/domain/schemas/line-types.schema.ts";

export const DEFAULTS: Review = {
  keyVariable: "OPENAI_API_KEY",
  model: "gpt-6-luna",
  threshold: 0.85,
  spanLines: 40,
  batch: { files: 8, chars: 60_000 },
  modules: "src/*",
};
