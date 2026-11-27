import type { LineName } from "../../../shared/domain/schemas/line-name.schema.ts";
import { EngineeringException } from "../../domain/exceptions/engineering.exceptions.ts";
import type { PlantRepositoryInterface } from "../repository-interfaces/plant.repository-interface.ts";

export class PrepareLineUseCase {
  private readonly plants: PlantRepositoryInterface;

  constructor(plants: PlantRepositoryInterface) {
    this.plants = plants;
  }

  async execute(name: LineName): Promise<string[]> {
    const plant = await this.plants.getPlant();
    const line = plant.findLine(name);
    if (!line) throw new EngineeringException(`Unknown line ${name}`);
    return this.plants.prepareRoots(plant, line);
  }
}
