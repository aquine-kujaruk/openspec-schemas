import { validateSchema } from "../../../shared/domain/schemas/validation.schema.ts";
import { AuditStateSchema, QualityCertificateSchema, type InspectionVerdict, type QualityCertificateProps } from "../schemas/quality-certificate.schema.ts";
import type { ScenarioResultValueObject } from "../value-objects/scenario-result.value-object.ts";

export class QualityCertificateAggregate {
  readonly workOrder!: string;
  readonly digest!: string;
  readonly scenarios!: ScenarioResultValueObject[];
  readonly failing!: QualityCertificateProps["failing"];
  readonly review!: QualityCertificateProps["review"];
  readonly procedures!: QualityCertificateProps["procedures"];
  readonly e2e?: QualityCertificateProps["e2e"];

  constructor(props: QualityCertificateProps) {
    validateSchema(this, QualityCertificateSchema, props);
  }

  get change(): string {
    return this.workOrder;
  }

  get unproved(): ScenarioResultValueObject[] {
    return this.scenarios.filter((scenario) => scenario.result !== "passed");
  }

  get unexercised(): QualityCertificateProps["procedures"] {
    return this.procedures.filter((entry) => entry.treatment === "not executed" || entry.outcome === "failed");
  }

  get verdict(): InspectionVerdict {
    return this.unproved.length || this.failing.length || this.unexercised.length || this.review.state === AuditStateSchema.enum.incomplete ? "not verified" : "verified";
  }
}
