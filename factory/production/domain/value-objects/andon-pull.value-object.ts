import { validateSchema } from "../../../shared/domain/schemas/validation.schema.ts";
import { AndonPullSchema, type AndonPullProps } from "../schemas/andon-pull.schema.ts";

export class AndonPull {
  readonly from!: string;
  readonly names!: string;
  readonly says!: string;

  constructor(props: AndonPullProps) {
    validateSchema(this, AndonPullSchema, props);
  }
}
