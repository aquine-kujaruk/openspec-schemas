import { validateSchema } from "../../../shared/domain/schemas/validation.schema.ts";
import { DefectSchema, type DefectProps } from "../schemas/defect.schema.ts";

export class Defect {
  readonly file!: string;
  readonly standard!: string;
  readonly tool!: string;

  constructor(props: DefectProps) {
    validateSchema(this, DefectSchema, props);
  }
}
