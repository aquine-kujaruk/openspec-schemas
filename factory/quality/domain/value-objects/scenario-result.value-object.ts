import { validateSchema } from "../../../shared/domain/schemas/validation.schema.ts";
import { ScenarioResultSchema, type ScenarioResultProps } from "../schemas/scenario-result.schema.ts";

export class ScenarioResult {
  readonly spec!: string;
  readonly requirement!: string;
  readonly scenario!: string;
  readonly result!: ScenarioResultProps["result"];
  readonly by?: ScenarioResultProps["by"];

  constructor(props: ScenarioResultProps) {
    validateSchema(this, ScenarioResultSchema, props);
  }
}
