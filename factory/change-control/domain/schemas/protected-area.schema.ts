import { z } from "zod";

export const ProtectedAreaSchema = z.object({
  name: z.string(),
  patterns: z.array(z.string()),
  guidance: z.string(),
  suffix: z.string().optional(),
  regularExpression: z.boolean().optional(),
});

export type ProtectedAreaProps = z.input<typeof ProtectedAreaSchema>;
