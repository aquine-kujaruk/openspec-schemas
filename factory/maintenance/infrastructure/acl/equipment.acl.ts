import type { Installed } from "../../../shared/domain/schemas/line-types.schema.ts";
import type { MaintenanceOptions } from "../../application/repository-interfaces/equipment.repository-interface.ts";
import type { EquipmentEntity } from "../../domain/entities/equipment.entity.ts";

import type {
  EquipmentNotes,
  EquipmentPlace,
  EquipmentReading,
  EquipmentRepair,
} from "../../domain/schemas/equipment-reading.schema.ts";

import type { EquipmentHoldings, EquipmentProcedure } from "../../domain/schemas/procedure-reading.schema.ts";

export { RepairKind } from "../../domain/schemas/equipment-reading.schema.ts";
export { SECTION } from "../../domain/services/equipment-installation.service.ts";
export type EquipmentInstallation = { installed: Installed; assets: string };

export type EquipmentAuthority = {
  readProcedures(root: string): Map<string, EquipmentProcedure>;
  listProductRoots(root: string): Promise<string[]>;
  hasWebProduct(root: string): Promise<boolean>;
  environment(): Record<string, string | undefined>;
  nodeVersion: string;
  loadEnv(root: string, env: Record<string, string | undefined>): Record<string, string | undefined>;
  run(command: string, args: string[], cwd: string): { status: number; stdout: string; stderr: string };
  withSection(own: string | undefined, instructions: string[]): string;
  pinnedVersion(command: string, manifest: { devDependencies?: Record<string, string> }, lock: object): string | undefined;
};

export const PLACES: Record<string, EquipmentPlace> = {
  claude: {
    skills: ".claude/skills",
    instruction: { rules: ".claude/rules" },
    hooks: ".claude/settings.json",
  },
  codex: {
    skills: ".agents/skills",
    instruction: { file: "AGENTS.md" },
    hooks: ".codex/hooks.json",
  },
};

export interface EquipmentAcl {
  readInstalled(root: string): EquipmentInstallation | undefined;
  inspectEquipment(root: string, equipment: EquipmentEntity, node?: string): Promise<EquipmentReading>;
  repairEquipment(root: string, equipment: EquipmentEntity, repair: EquipmentRepair): void;
  readNotes(root: string, equipment: EquipmentEntity, env?: MaintenanceOptions["env"]): EquipmentNotes;
  listProcedures(root: string): Map<string, EquipmentProcedure>;
  readHoldings(root: string): Promise<EquipmentHoldings>;
}
