import { z } from "zod";

export const DefectSchema = z.object({
  file: z.string(),
  standard: z.string().min(1),
  tool: z.string().min(1),
});

export type DefectProps = z.input<typeof DefectSchema>;
