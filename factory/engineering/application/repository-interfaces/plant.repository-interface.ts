import type { LineEntity } from "../../../shared/domain/entities/line.entity.ts";
import type { PlantEntity } from "../../../shared/domain/entities/plant.entity.ts";
import type { PlantRecord } from "../../../shared/domain/schemas/plant.schema.ts";

export interface PlantRepositoryInterface {
  getPlant(): Promise<PlantRecord>;
  prepareRoots(plant: PlantEntity, line: LineEntity): Promise<string[]>;
}
