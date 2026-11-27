import { validateSchema } from "../../../shared/domain/schemas/validation.schema.ts";
import type { ProcessName } from "../../../shared/domain/schemas/process-name.schema.ts";
import { EquipmentSchema, type EquipmentProps } from "../schemas/equipment.schema.ts";

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
}
