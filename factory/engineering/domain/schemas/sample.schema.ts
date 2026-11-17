import { z } from "zod";
import { StandardId } from "../value-objects/standard-id.value-object.ts";

const defectSchema = z.object({ file: z.string().min(1), standard: z.instanceof(StandardId) });
export type Defect = z.infer<typeof defectSchema>;

export const SampleSchema = z.object({
  standard: z.instanceof(StandardId),
  files: z.map(z.string(), z.string()),
  expected: z.array(defectSchema),
});
export type SampleProps = z.infer<typeof SampleSchema>;
