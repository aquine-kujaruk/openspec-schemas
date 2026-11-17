import { validateSchema } from "../schemas/validation.schema.ts";
import { LineSchema, type LineProps } from "../schemas/line.schema.ts";
import type { LineName } from "../value-objects/line-name.value-object.ts";
import type { ProcessName } from "../value-objects/process-name.value-object.ts";
import type { LineRoots } from "../value-objects/line-roots.value-object.ts";

export class Line {
  readonly name!: LineName;
  readonly folder!: string;
  readonly process!: ProcessName;
  readonly roots!: LineRoots;

  constructor(props: LineProps) {
    validateSchema(this, LineSchema, props);
  }
}
