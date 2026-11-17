import { validateSchema } from "../../../shared/domain/schemas/validation.schema.ts";
import { GaugeSchema, type GaugeProps } from "../schemas/gauge.schema.ts";

export class Gauge {
  readonly drawing!: string;
  readonly file!: string;

  constructor(props: GaugeProps) {
    validateSchema(this, GaugeSchema, props);
  }
}
