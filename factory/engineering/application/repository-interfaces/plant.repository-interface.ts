import type { LineEntity } from "../../../shared/domain/entities/line.entity.ts";
import type { PlantEntity } from "../../../shared/domain/entities/plant.entity.ts";

export interface PlantRepositoryInterface {
  getPlant(): Promise<PlantEntity>;
  prepareRoots(plant: PlantEntity, line: LineEntity): Promise<string[]>;
}
