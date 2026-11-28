import { z } from "zod";

export const LineRootsSchema = z.object({
  modules: z.string(),
  productSpecs: z.string(),
  entry: z.array(z.string()),
  acceptance: z.string(),
  unit: z.string(),
  integration: z.string(),
  e2e: z.string(),
  ignore: z.array(z.string()),
  base: z.array(z.string()).optional(),
  allowUnmatched: z.array(z.string()).optional(),
});

export type LineRootsProps = z.infer<typeof LineRootsSchema>;
