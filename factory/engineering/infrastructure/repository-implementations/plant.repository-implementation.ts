import { Line } from "../../../shared/domain/entities/line.entity.ts";
import { Plant } from "../../../shared/domain/entities/plant.entity.ts";
import { LineName } from "../../../shared/domain/value-objects/line-name.value-object.ts";
import { LineRoots } from "../../../shared/domain/value-objects/line-roots.value-object.ts";
import { ProcessName } from "../../../shared/domain/value-objects/process-name.value-object.ts";
import type { PlantRepositoryInterface } from "../../application/repository-interfaces/plant.repository-interface.ts";
import { EngineeringException } from "../../domain/exceptions/engineering.exceptions.ts";
import { PlantRecordSchema, type PlantAcl } from "../acl/plant.acl.ts";

export class PlantRepositoryImplementation implements PlantRepositoryInterface {
  private readonly records: PlantAcl;

  constructor(records: PlantAcl) {
    this.records = records;
  }

  async getPlant(): Promise<Plant> {
    try {
      const record = PlantRecordSchema.parse(await this.records.readPlant());
      return new Plant({
        root: record.root,
        lines: record.lines.map((line) => new Line({
          name: new LineName({ value: line.name }),
          folder: line.folder,
          process: new ProcessName({ value: line.process }),
          roots: new LineRoots(line.roots),
        })),
      });
    } catch (cause) {
      throw new EngineeringException("The plant configuration could not be loaded", { cause });
    }
  }

  async prepareRoots(plant: Plant, line: Line): Promise<string[]> {
    try {
      return await this.records.prepareRoots(plant.root, line.roots);
    } catch (cause) {
      throw new EngineeringException("The line could not be prepared", { cause });
    }
  }
}
