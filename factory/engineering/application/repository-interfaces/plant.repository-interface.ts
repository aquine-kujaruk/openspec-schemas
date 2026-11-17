import type { Line } from "../../../shared/domain/entities/line.entity.ts";
import type { Plant } from "../../../shared/domain/entities/plant.entity.ts";

export interface PlantRepositoryInterface {
  getPlant(): Promise<Plant>;
  prepareRoots(plant: Plant, line: Line): Promise<string[]>;
}
