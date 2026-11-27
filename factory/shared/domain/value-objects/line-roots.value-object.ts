import { validateSchema } from "../schemas/validation.schema.ts";
import { LineRootsSchema, type LineRootsProps } from "../schemas/line-roots.schema.ts";

export class LineRootsValueObject {
  readonly modules!: string;
  readonly productSpecs!: string;
  readonly entry!: string[];
  readonly acceptance!: string;
  readonly unit!: string;
  readonly integration!: string;
  readonly e2e!: string;
  readonly ignore!: string[];
  readonly base?: string[];
  readonly allowUnmatched?: string[];

  constructor(props: LineRootsProps) {
    validateSchema(this, LineRootsSchema, props);
  }
}
