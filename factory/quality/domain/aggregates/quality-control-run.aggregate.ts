import { validateSchema } from "../../../shared/domain/schemas/validation.schema.ts";
import { QualityControlRunSchema, type QualityControlRunProps } from "../schemas/quality-control-run.schema.ts";
import type { DefectValueObject } from "../value-objects/defect.value-object.ts";

export class QualityControlRunAggregate {
  readonly defects!: DefectValueObject[];
  readonly exitStatus!: number;

  constructor(props: QualityControlRunProps) {
    validateSchema(this, QualityControlRunSchema, props);
  }

  passed(): boolean {
    return this.exitStatus === 0 && this.defects.length === 0;
  }
}
