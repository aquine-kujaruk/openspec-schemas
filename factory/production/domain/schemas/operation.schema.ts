import { z } from "zod";
export type WorkCenterId = string;

export const OperationSchema = z.object({
  workCenter: z.string().min(1).optional(),
  text: z.string().min(1),
  done: z.boolean(),
});
export type OperationProps = z.input<typeof OperationSchema>;
