import { ProcessName } from "../../../shared/domain/value-objects/process-name.value-object.ts";
import type { EquipmentRepositoryInterface, MaintenanceOptions } from "../../application/repository-interfaces/equipment.repository-interface.ts";
import { Equipment } from "../../domain/aggregates/equipment.aggregate.ts";
import { MaintenanceException } from "../../domain/exceptions/maintenance.exceptions.ts";
import type { EquipmentRepair } from "../../domain/schemas/equipment-reading.schema.ts";
import type { EquipmentAcl } from "../acl/equipment.acl.ts";

export class EquipmentRepositoryImplementation implements EquipmentRepositoryInterface {
  private readonly resources: EquipmentAcl;

  constructor(resources: EquipmentAcl) {
    this.resources = resources;
  }

  findEquipment(root: string): Equipment | null {
    return this.read(() => {
      const found = this.resources.readInstalled(root);
      if (!found) return null;
      const { installed, assets } = found;
      return new Equipment({
        name: installed.package,
        version: installed.version,
        processes: installed.schemas.map((value) => new ProcessName({ value })),
        workInstructions: installed.phases,
        controls: installed.guards,
        command: installed.command,
        assets,
        agents: installed.agents,
        instructions: installed.instructions,
        packageManager: installed.packageManager,
        project: installed.project,
      });
    });
  }

  async inspectEquipment(root: string, equipment: Equipment, node?: string) {
    return await this.resources.inspectEquipment(root, equipment, node);
  }

  repairEquipment(root: string, equipment: Equipment, repair: EquipmentRepair): void {
    this.read(() => this.resources.repairEquipment(root, equipment, repair));
  }

  readNotes(root: string, equipment: Equipment, env?: MaintenanceOptions["env"]) {
    return this.read(() => this.resources.readNotes(root, equipment, env));
  }

  listProcedures(root: string) {
    return this.read(() => this.resources.listProcedures(root));
  }

  readHoldings(root: string) {
    return this.resources.readHoldings(root);
  }

  private read<T>(action: () => T): T {
    try {
      return action();
    } catch (cause) {
      throw new MaintenanceException(cause instanceof Error ? cause.message : String(cause), { cause });
    }
  }
}
