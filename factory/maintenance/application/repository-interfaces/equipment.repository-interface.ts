import type { Equipment } from "../../domain/aggregates/equipment.aggregate.ts";
import type { EquipmentNotes, EquipmentReading, EquipmentRepair } from "../../domain/schemas/equipment-reading.schema.ts";
import type { EquipmentHoldings, EquipmentProcedure } from "../../domain/schemas/procedure-reading.schema.ts";

export type MaintenanceOptions = {
  fix?: boolean;
  env?: Record<string, string | undefined>;
  node?: string;
};

export interface EquipmentRepositoryInterface {
  findEquipment(root: string): Equipment | null;
  inspectEquipment(root: string, equipment: Equipment, node?: string): Promise<EquipmentReading>;
  repairEquipment(root: string, equipment: Equipment, repair: EquipmentRepair): void;
  readNotes(root: string, equipment: Equipment, env?: MaintenanceOptions["env"]): EquipmentNotes;
  listProcedures(root: string): Map<string, EquipmentProcedure>;
  readHoldings(root: string): Promise<EquipmentHoldings>;
}
