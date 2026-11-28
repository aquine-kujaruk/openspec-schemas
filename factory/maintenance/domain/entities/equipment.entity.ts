import { validateSchema } from "../../../shared/domain/schemas/validation.schema.ts";
import type { ProcessName } from "../../../shared/domain/schemas/process-name.schema.ts";
import { EquipmentRecordSchema, EquipmentSchema, type EquipmentProps, type EquipmentRecord } from "../schemas/equipment.schema.ts";

export class EquipmentEntity {
  readonly name!: string;
  readonly version!: string;
  readonly processes!: ProcessName[];
  readonly workInstructions!: string[];
  readonly controls!: string[];
  readonly command!: string;
  readonly assets!: string;
  readonly agents!: string[];
  readonly instructions!: Record<string, string>;
  readonly packageManager!: EquipmentProps["packageManager"];
  readonly project!: EquipmentProps["project"];

  constructor(props: EquipmentProps) {
    validateSchema(this, EquipmentSchema, props);
  }

  static from(record: EquipmentRecord): EquipmentEntity {
    const { installed, assets } = EquipmentRecordSchema.parse(record);

    return new EquipmentEntity({
      name: installed.package,
      version: installed.version,
      processes: installed.schemas,
      workInstructions: installed.phases,
      controls: installed.guards,
      command: installed.command,
      assets,
      agents: installed.agents,
      instructions: installed.instructions,
      packageManager: installed.packageManager,
      project: installed.project,
    });
  }
}
