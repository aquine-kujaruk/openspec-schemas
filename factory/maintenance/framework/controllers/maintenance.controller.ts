import type { MaintainEquipmentUseCase } from "../../application/use-cases/maintain-equipment.use-case.ts";
import { MaintenanceKind } from "../../domain/schemas/maintenance-item.schema.ts";
import type { Io } from "../../../shared/domain/schemas/io.schema.ts";

export type MaintenancePorts = {
  maintain: MaintainEquipmentUseCase;
  root: string;
  missingPackage: string;
};

export class MaintenanceController {
  private readonly ports: MaintenancePorts;
  private readonly io: Io;

  constructor(ports: MaintenancePorts, io: Io) {
    this.ports = ports;
    this.io = io;
  }

  async doctor(args: string[]): Promise<number> {
    const report = await this.ports.maintain.execute(this.ports.root, { fix: args.includes("--fix") });

    if (!report) {
      this.io.warn(this.ports.missingPackage);

      return 2;
    }

    const lacks = report.items.filter(({ kind }) => kind === MaintenanceKind.Missing || kind === MaintenanceKind.Drift);
    const of = (kind: string) => report.items.filter((item) => item.kind === kind);

    for (const { report: state, requirement, agent, detail } of lacks)
      this.io.write(`${state}: ${requirement}${agent ? ` for ${agent}` : ""} — ${detail}`);

    if (!lacks.length && !of(MaintenanceKind.Outdated).length) this.io.write("nothing is lacking");
    for (const { detail } of of(MaintenanceKind.Note)) this.io.write(`note: ${detail}`);
    for (const { detail } of of(MaintenanceKind.Suspect)) this.io.write(`suspect: ${detail}`);
    for (const { requirement, detail } of of(MaintenanceKind.Outdated)) this.io.write(`outdated: ${requirement} — ${detail}`);

    return report.status;
  }
}
