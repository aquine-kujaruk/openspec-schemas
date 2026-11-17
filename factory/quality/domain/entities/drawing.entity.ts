import { validateSchema } from "../../../shared/domain/schemas/validation.schema.ts";
import { DrawingSchema, type DrawingProps, type Scenario } from "../schemas/drawing.schema.ts";

export class Drawing {
  readonly path!: string;
  readonly scenarios!: Scenario[];

  constructor(props: DrawingProps) {
    validateSchema(this, DrawingSchema, props);
  }
}
