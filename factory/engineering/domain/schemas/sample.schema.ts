import { z } from "zod";
import { StandardIdSchema } from "../schemas/standard-id.schema.ts";

const defectSchema = z.object({ file: z.string().min(1), standard: StandardIdSchema });
export type Defect = z.infer<typeof defectSchema>;

export const SampleSchema = z.object({
  standard: StandardIdSchema,
  files: z.map(z.string(), z.string()),
  expected: z.array(defectSchema),
});

export type SampleProps = z.infer<typeof SampleSchema>;
