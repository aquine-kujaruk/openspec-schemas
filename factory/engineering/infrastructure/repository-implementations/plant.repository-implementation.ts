import type { LineEntity } from "../../../shared/domain/entities/line.entity.ts";
import type { PlantEntity } from "../../../shared/domain/entities/plant.entity.ts";
import type { PlantRecord } from "../../../shared/domain/schemas/plant.schema.ts";

import type { PlantRepositoryInterface } from "../../application/repository-interfaces/plant.repository-interface.ts";
import { EngineeringException } from "../../domain/exceptions/engineering.exceptions.ts";
import { PlantRecordSchema, type PlantAcl } from "../acl/plant.acl.ts";

export class PlantRepositoryImplementation implements PlantRepositoryInterface {
  private readonly records: PlantAcl;

  constructor(records: PlantAcl) {
    this.records = records;
  }

  async getPlant(): Promise<PlantRecord> {
    try {
      return PlantRecordSchema.parse(await this.records.readPlant());
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
