import { validateSchema } from "../../../shared/domain/schemas/validation.schema.ts";
import { AuthorizationSchema, type AuthorizationProps, type Refusal } from "../schemas/authorization.schema.ts";
import type { ProtectedArea } from "./protected-area.value-object.ts";

export class Authorization {
  readonly blockedBy?: ProtectedArea;
  readonly refusals!: Refusal[];

  constructor(props: AuthorizationProps) {
    validateSchema(this, AuthorizationSchema, props);
  }

  get allowed(): boolean {
    return this.refusals.length === 0;
  }
}
