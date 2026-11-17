import { z } from "zod";
import { Operation } from "../value-objects/operation.value-object.ts";

export const StageSchema = z.object({
  title: z.string().min(1),
  operations: z.array(z.instanceof(Operation)),
});
export type StageProps = z.input<typeof StageSchema>;
