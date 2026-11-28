import { validateSchema } from "../schemas/validation.schema.ts";
import { PlantRecordSchema, PlantSchema, type PlantProps, type PlantRecord } from "../schemas/plant.schema.ts";
import { LineEntity } from "../entities/line.entity.ts";
import type { LineName } from "../schemas/line-name.schema.ts";
import { PlantException } from "../exceptions/plant.exceptions.ts";
import { LineRootsValueObject } from "../value-objects/line-roots.value-object.ts";

export class PlantEntity {
  readonly root!: string;
  readonly lines!: LineEntity[];

  constructor(props: PlantProps) {
    validateSchema(this, PlantSchema, props);
  }

  static from(record: PlantRecord): PlantEntity {
    const { root, lines } = PlantRecordSchema.parse(record);

    return new PlantEntity({
      root,
      lines: lines.map((line) => new LineEntity({ ...line, roots: new LineRootsValueObject(line.roots) })),
    });
  }

  findLine(name: LineName): LineEntity | undefined {
    return this.lines.find((line) => line.name === name);
  }

  lineNamed(name: LineName): LineEntity {
    const line = this.findLine(name);
    if (!line) throw new PlantException(`Unknown line ${name}`, { cause: { name, lines: this.lines.map((known) => known.name) } });

    return line;
  }
}
