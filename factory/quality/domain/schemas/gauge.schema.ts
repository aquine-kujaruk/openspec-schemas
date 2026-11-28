import { z } from "zod";

export const GaugeSchema = z.object({
  drawing: z.string().min(1),
  file: z.string().min(1),
});

export type GaugeProps = z.input<typeof GaugeSchema>;
