import { validateSchema } from "../schemas/validation.schema.ts";
import { PlantSchema, type PlantProps } from "../schemas/plant.schema.ts";
import type { Line } from "../entities/line.entity.ts";
import type { LineName } from "../value-objects/line-name.value-object.ts";

export class Plant {
  readonly root!: string;
  readonly lines!: Line[];

  constructor(props: PlantProps) {
    validateSchema(this, PlantSchema, props);
  }

  findLine(name: LineName): Line | undefined {
    return this.lines.find((line) => line.name.equals(name));
  }
}
