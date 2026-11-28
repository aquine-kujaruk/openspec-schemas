import { z } from "zod";
import { OperationValueObject } from "../value-objects/operation.value-object.ts";

export const StageSchema = z.object({
  title: z.string().min(1),
  operations: z.array(z.instanceof(OperationValueObject)),
});

export type StageProps = z.input<typeof StageSchema>;
