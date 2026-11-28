import { validateSchema } from "../../../shared/domain/schemas/validation.schema.ts";
import { DrawingSchema, type DrawingProps, type DrawingRecord, type Scenario } from "../schemas/drawing.schema.ts";

export class DrawingEntity {
  readonly path!: string;
  readonly scenarios!: Scenario[];

  constructor(props: DrawingProps) {
    validateSchema(this, DrawingSchema, props);
  }

  static from({ path, gherkin }: Pick<DrawingRecord, "path" | "gherkin">): DrawingEntity {
    const scenarios: Scenario[] = [];
    let requirement = "Feature";

    for (const line of gherkin.split("\n")) {
      const rule = /^\s*Rule:\s+(.+)\s*$/.exec(line);
      if (rule) requirement = rule[1]!.trim();

      const scenario = /^\s*Scenario(?: Outline)?:\s+(.+)\s*$/.exec(line);
      if (scenario) scenarios.push({ title: scenario[1]!.trim(), requirement });
    }

    return new DrawingEntity({ path, scenarios });
  }
}
