import { validateSchema } from "../../../shared/domain/schemas/validation.schema.ts";
import { SampleSchema, type SampleProps, type Defect } from "../schemas/sample.schema.ts";
import type { StandardId } from "../value-objects/standard-id.value-object.ts";

export class Sample {
  readonly standard!: StandardId;
  readonly files!: Map<string, string>;
  readonly expected!: Defect[];

  constructor(props: SampleProps) {
    validateSchema(this, SampleSchema, props);
  }
}
