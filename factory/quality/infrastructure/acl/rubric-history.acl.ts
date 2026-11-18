import { z } from "zod";

const FingerprintSchema = z.string().regex(/^[a-f0-9]{64}$/);
const RubricObservationSchema = z.object({
  score: z.number().min(0).max(1),
  model: z.string().min(1),
  question: FingerprintSchema,
  case: FingerprintSchema,
  date: z.string().datetime(),
  baseline: z.object({ by: z.literal("person"), reason: z.string().min(1) }).optional(),
});

export const RubricHistorySchema = z.record(z.string(), z.array(RubricObservationSchema));
export type RubricObservation = z.infer<typeof RubricObservationSchema>;


export interface RubricHistoryAcl {
  read(id: string): RubricObservation[];
  append(id: string, observation: RubricObservation): Promise<RubricObservation[]>;
}
