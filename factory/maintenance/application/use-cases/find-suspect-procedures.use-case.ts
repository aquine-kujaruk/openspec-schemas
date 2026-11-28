import { SuspectProcedureService } from "../../domain/services/suspect-procedure.service.ts";
import type { EquipmentRepositoryInterface } from "../repository-interfaces/equipment.repository-interface.ts";

export class FindSuspectProceduresUseCase {
  private readonly equipment: EquipmentRepositoryInterface;
  private readonly inspection = new SuspectProcedureService();

  constructor(equipment: EquipmentRepositoryInterface) {
    this.equipment = equipment;
  }

  async execute(root: string): Promise<string[]> {
    const holdings = await this.equipment.readHoldings(root);

    return this.inspection.suspectsOf(this.equipment.listProcedures(root), holdings);
  }
}
