import { validateSchema } from "../schemas/validation.schema.ts";
import { LineSchema, type LineProps } from "../schemas/line.schema.ts";
import type { LineName } from "../schemas/line-name.schema.ts";
import type { ProcessName } from "../schemas/process-name.schema.ts";
import type { LineRootsValueObject } from "../value-objects/line-roots.value-object.ts";

export class LineEntity {
  readonly name!: LineName;
  readonly folder!: string;
  readonly process!: ProcessName;
  readonly roots!: LineRootsValueObject;

  constructor(props: LineProps) {
    validateSchema(this, LineSchema, props);
  }
}
