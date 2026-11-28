import { z } from "zod";
import { DefectValueObject } from "../value-objects/defect.value-object.ts";

export const QualityControlRunSchema = z.object({
  defects: z.array(z.instanceof(DefectValueObject)),
  exitStatus: z.number().int().min(0),
});

export const QualityControlRunRecordSchema = z.object({
  exitStatus: z.number().int().min(0),
  defects: z.array(z.object({ file: z.string(), standard: z.string(), tool: z.string() })),
});

export type QualityControlRunProps = z.input<typeof QualityControlRunSchema>;
export type QualityControlRunRecord = z.input<typeof QualityControlRunRecordSchema>;
