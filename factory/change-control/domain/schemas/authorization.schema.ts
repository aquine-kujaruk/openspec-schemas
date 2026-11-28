import { z } from "zod";
import { ProtectedAreaValueObject } from "../value-objects/protected-area.value-object.ts";

const RefusalSchema = z.object({
  path: z.string(), part: z.string().optional(), reason: z.string(),
});

export const AuthorizationSchema = z.object({
  blockedBy: z.instanceof(ProtectedAreaValueObject).optional(),
  refusals: z.array(RefusalSchema),
});

export type Refusal = z.infer<typeof RefusalSchema>;
export type AuthorizationProps = z.input<typeof AuthorizationSchema>;
