import { validateSchema } from "../../../shared/domain/schemas/validation.schema.ts";
import { SampleSchema, type SampleProps, type Defect } from "../schemas/sample.schema.ts";
import type { StandardId } from "../schemas/standard-id.schema.ts";

export class SampleValueObject {
  readonly standard!: StandardId;
  readonly files!: Map<string, string>;
  readonly expected!: Defect[];

  constructor(props: SampleProps) {
    validateSchema(this, SampleSchema, props);
  }
}
