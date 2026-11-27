import { LineEntity } from "../../../shared/domain/entities/line.entity.ts";
import { PlantEntity } from "../../../shared/domain/entities/plant.entity.ts";

import { LineRootsValueObject } from "../../../shared/domain/value-objects/line-roots.value-object.ts";

import type { PlantRepositoryInterface } from "../../application/repository-interfaces/plant.repository-interface.ts";
import { EngineeringException } from "../../domain/exceptions/engineering.exceptions.ts";
import { PlantRecordSchema, type PlantAcl } from "../acl/plant.acl.ts";

export class PlantRepositoryImplementation implements PlantRepositoryInterface {
  private readonly records: PlantAcl;

  constructor(records: PlantAcl) {
    this.records = records;
  }

  async getPlant(): Promise<PlantEntity> {
    try {
      const record = PlantRecordSchema.parse(await this.records.readPlant());
      return new PlantEntity({
        root: record.root,
        lines: record.lines.map((line) => new LineEntity({
          name: line.name,
          folder: line.folder,
          process: line.process,
          roots: new LineRootsValueObject(line.roots),
        })),
      });
    } catch (cause) {
      throw new EngineeringException("The plant configuration could not be loaded", { cause });
    }
  }

  async prepareRoots(plant: PlantEntity, line: LineEntity): Promise<string[]> {
    try {
      return await this.records.prepareRoots(plant.root, line.roots);
    } catch (cause) {
      throw new EngineeringException("The line could not be prepared", { cause });
    }
  }
}
