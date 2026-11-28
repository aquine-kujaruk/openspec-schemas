import { validateSchema } from "../../../shared/domain/schemas/validation.schema.ts";
import { QualityControlRunRecordSchema, QualityControlRunSchema, type QualityControlRunProps, type QualityControlRunRecord } from "../schemas/quality-control-run.schema.ts";
import { DefectValueObject } from "../value-objects/defect.value-object.ts";

export class QualityControlRunAggregate {
  readonly defects!: DefectValueObject[];
  readonly exitStatus!: number;

  constructor(props: QualityControlRunProps) {
    validateSchema(this, QualityControlRunSchema, props);
  }

  static from(record: QualityControlRunRecord): QualityControlRunAggregate {
    const { exitStatus, defects } = QualityControlRunRecordSchema.parse(record);

    return new QualityControlRunAggregate({ exitStatus, defects: defects.map((defect) => new DefectValueObject(defect)) });
  }

  passed(): boolean {
    return this.exitStatus === 0 && this.defects.length === 0;
  }
}
