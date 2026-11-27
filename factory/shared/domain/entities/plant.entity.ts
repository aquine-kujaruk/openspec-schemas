import { validateSchema } from "../schemas/validation.schema.ts";
import { PlantSchema, type PlantProps } from "../schemas/plant.schema.ts";
import type { LineEntity } from "../entities/line.entity.ts";
import type { LineName } from "../schemas/line-name.schema.ts";

export class PlantEntity {
  readonly root!: string;
  readonly lines!: LineEntity[];

  constructor(props: PlantProps) {
    validateSchema(this, PlantSchema, props);
  }

  findLine(name: LineName): LineEntity | undefined {
    return this.lines.find((line) => line.name === name);
  }
}
