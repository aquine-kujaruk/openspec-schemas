import { validateSchema } from "../../../shared/domain/schemas/validation.schema.ts";
import { AuditFindingSchema, type AuditFindingProps } from "../schemas/audit-finding.schema.ts";

export class AuditFindingValueObject {
  readonly file!: string;
  readonly row!: string;
  readonly verdict!: "accepted" | "rejected";
  readonly p!: number;
  readonly from!: number;
  readonly to!: number;
  readonly title!: string;

  constructor(props: AuditFindingProps) {
    validateSchema(this, AuditFindingSchema, props);
  }

  format(): string {
    return `${this.row} p=${this.p.toFixed(2)} ${this.file}:${this.from}-${this.to} — ${this.title}`;
  }
}
