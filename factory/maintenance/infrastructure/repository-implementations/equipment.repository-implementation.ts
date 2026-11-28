
import type { EquipmentRepositoryInterface, MaintenanceOptions } from "../../application/repository-interfaces/equipment.repository-interface.ts";
import type { EquipmentEntity } from "../../domain/entities/equipment.entity.ts";
import type { EquipmentRecord } from "../../domain/schemas/equipment.schema.ts";
import { MaintenanceException } from "../../domain/exceptions/maintenance.exceptions.ts";
import type { EquipmentRepair } from "../../domain/schemas/equipment-reading.schema.ts";
import { RuleConformanceSchema, type RuleConformance } from "../../domain/schemas/rule-conformance.schema.ts";
import type { EquipmentAcl } from "../acl/equipment.acl.ts";

export class EquipmentRepositoryImplementation implements EquipmentRepositoryInterface {
  private readonly resources: EquipmentAcl;

  constructor(resources: EquipmentAcl) {
    this.resources = resources;
  }

  findEquipment(root: string): EquipmentRecord | null {
    return this.read(() => this.resources.readInstalled(root) ?? null);
  }

  async inspectEquipment(root: string, equipment: EquipmentEntity, node?: string) {
    return await this.resources.inspectEquipment(root, equipment, node);
  }

  repairEquipment(root: string, equipment: EquipmentEntity, repair: EquipmentRepair): void {
    this.read(() => this.resources.repairEquipment(root, equipment, repair));
  }

  readNotes(root: string, equipment: EquipmentEntity, env?: MaintenanceOptions["env"]) {
    return this.read(() => this.resources.readNotes(root, equipment, env));
  }

  listProcedures(root: string) {
    return this.read(() => this.resources.listProcedures(root));
  }

  readHoldings(root: string) {
    return this.resources.readHoldings(root);
  }

  async inferRuleConformance(root: string): Promise<RuleConformance[]> {
    const records = await this.resources.readRuleConformance(root);

    return this.read(() => records.map((record) => RuleConformanceSchema.parse(record)));
  }

  private read<T>(action: () => T): T {
    try {
      return action();
    } catch (cause) {
      throw new MaintenanceException(cause instanceof Error ? cause.message : String(cause), { cause });
    }
  }
}
