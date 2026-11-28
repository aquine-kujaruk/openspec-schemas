import { MaintenanceReportAggregate } from "../../domain/aggregates/maintenance-report.aggregate.ts";
import type { EquipmentFinding } from "../../domain/schemas/equipment-reading.schema.ts";
import { MaintenanceKind } from "../../domain/schemas/maintenance-item.schema.ts";
import { EquipmentInspectionService } from "../../domain/services/equipment-inspection.service.ts";
import { MaintenanceItemValueObject } from "../../domain/value-objects/maintenance-item.value-object.ts";
import type { EquipmentRepositoryInterface, MaintenanceOptions } from "../repository-interfaces/equipment.repository-interface.ts";
import { FindSuspectProceduresUseCase } from "./find-suspect-procedures.use-case.ts";

const id = (lack: EquipmentFinding): string =>
  `${lack.requirement}|${lack.agent ?? ""}|${lack.detail}`;

export class MaintainEquipmentUseCase {
  private readonly equipment: EquipmentRepositoryInterface;
  private readonly inspection = new EquipmentInspectionService();
  private readonly suspectProcedures: FindSuspectProceduresUseCase;

  constructor(equipment: EquipmentRepositoryInterface) {
    this.equipment = equipment;
    this.suspectProcedures = new FindSuspectProceduresUseCase(equipment);
  }

  async execute(root: string, { fix, env, node }: MaintenanceOptions = {}): Promise<MaintenanceReportAggregate | null> {
    const installed = this.equipment.findEquipment(root);
    if (!installed) return null;

    const findings = async () => this.inspection.findings(
      installed,
      await this.equipment.inspectEquipment(root, installed, node),
    );

    const tried = new Map<string, EquipmentFinding>();
    const failures = new Map<string, string>();

    for (; fix; ) {
      const next = (await findings()).find((lack) => lack.repair && !tried.has(id(lack)));
      if (!next?.repair) break;
      tried.set(id(next), next);

      try {
        this.equipment.repairEquipment(root, installed, next.repair);
      } catch (cause) {
        failures.set(id(next), cause instanceof Error ? cause.message : String(cause));
      }
    }

    const remaining = await findings();
    const still = new Set(remaining.map(id));
    const notes = this.inspection.notes(installed, this.equipment.readNotes(root, installed, env));
    const suspects = await this.suspectProcedures.execute(root);
    const rules = await this.equipment.inferRuleConformance(root);

    return new MaintenanceReportAggregate({ items: [
      ...[...tried].filter(([key]) => !still.has(key))
        .map(([, item]) => new MaintenanceItemValueObject({ ...item, repaired: true })),
      ...remaining.map((item) => new MaintenanceItemValueObject({ ...item, detail: failures.get(id(item)) ?? item.detail })),
      ...notes.map((detail) => new MaintenanceItemValueObject({ kind: MaintenanceKind.Note, requirement: "maintenance", detail })),
      ...suspects.map((detail) => new MaintenanceItemValueObject({ kind: MaintenanceKind.Suspect, requirement: "a suspect runbook", detail })),
      ...rules.flatMap((conformance) => MaintenanceItemValueObject.ofRule(conformance) ?? []),
    ] });
  }
}
