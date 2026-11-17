import { validateSchema } from "../../../shared/domain/schemas/validation.schema.ts";
import { DrawingRevisionSchema, type DrawingRevisionProps } from "../schemas/drawing-revision.schema.ts";
import type { DrawingPath, RequirementChange } from "../schemas/drawing-revision.schema.ts";

export class DrawingRevision {
  readonly drawing!: DrawingPath;
  readonly requirements!: RequirementChange[];

  constructor(props: DrawingRevisionProps) {
    validateSchema(this, DrawingRevisionSchema, props);
  }
}
