import { validateSchema } from "../../../shared/domain/schemas/validation.schema.ts";
import { AuthorizationSchema, type AuthorizationProps, type Refusal } from "../schemas/authorization.schema.ts";
import type { ProtectedAreaValueObject } from "./protected-area.value-object.ts";

export class AuthorizationValueObject {
  readonly blockedBy?: ProtectedAreaValueObject;
  readonly refusals!: Refusal[];

  constructor(props: AuthorizationProps) {
    validateSchema(this, AuthorizationSchema, props);
  }

  get allowed(): boolean {
    return this.refusals.length === 0;
  }
}
