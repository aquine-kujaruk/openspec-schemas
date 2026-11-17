import { z } from "zod";
import { Defect } from "../value-objects/defect.value-object.ts";

export const QualityControlRunSchema = z.object({
  defects: z.array(z.instanceof(Defect)),
  exitStatus: z.number().int().min(0),
});
export type QualityControlRunProps = z.input<typeof QualityControlRunSchema>;
