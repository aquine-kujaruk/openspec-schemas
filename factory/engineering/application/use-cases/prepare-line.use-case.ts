import { PlantEntity } from "../../../shared/domain/entities/plant.entity.ts";
import type { LineName } from "../../../shared/domain/schemas/line-name.schema.ts";
import type { PlantRepositoryInterface } from "../repository-interfaces/plant.repository-interface.ts";

export class PrepareLineUseCase {
  private readonly plants: PlantRepositoryInterface;

  constructor(plants: PlantRepositoryInterface) {
    this.plants = plants;
  }

  async execute(name: LineName): Promise<string[]> {
    const plant = PlantEntity.from(await this.plants.getPlant());

    return this.plants.prepareRoots(plant, plant.lineNamed(name));
  }
}
