import { z } from "zod";
import { DefectValueObject } from "../value-objects/defect.value-object.ts";

export const QualityControlRunSchema = z.object({
  defects: z.array(z.instanceof(DefectValueObject)),
  exitStatus: z.number().int().min(0),
});
export type QualityControlRunProps = z.input<typeof QualityControlRunSchema>;
