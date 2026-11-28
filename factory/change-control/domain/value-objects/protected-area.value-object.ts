import { validateSchema } from "../../../shared/domain/schemas/validation.schema.ts";
import { ProtectedAreaSchema, type ProtectedAreaProps } from "../schemas/protected-area.schema.ts";

export class ProtectedAreaValueObject {
  readonly name!: string;
  readonly patterns!: string[];
  readonly guidance!: string;
  readonly suffix?: string;
  readonly regularExpression?: boolean;

  constructor(props: ProtectedAreaProps) {
    validateSchema(this, ProtectedAreaSchema, props);
  }

  covers(path: string): boolean {
    if (this.suffix && !path.endsWith(this.suffix)) return false;

    return this.patterns.some((pattern) =>
      this.regularExpression
        ? new RegExp(pattern).test(path)
        : path === pattern || path.startsWith(`${pattern}/`),
    );
  }
}
