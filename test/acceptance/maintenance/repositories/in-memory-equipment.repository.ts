import type { EquipmentRepositoryInterface } from "../../../../factory/maintenance/application/repository-interfaces/equipment.repository-interface.ts";
import type { EquipmentEntity } from "../../../../factory/maintenance/domain/entities/equipment.entity.ts";
import { RepairKind, type EquipmentNotes, type EquipmentReading, type EquipmentRepair } from "../../../../factory/maintenance/domain/schemas/equipment-reading.schema.ts";
import type { EquipmentHoldings, EquipmentProcedure } from "../../../../factory/maintenance/domain/schemas/procedure-reading.schema.ts";
import { EquipmentInstallationService } from "../../../../factory/maintenance/domain/services/equipment-installation.service.ts";

export class InMemoryEquipmentRepository implements EquipmentRepositoryInterface {
  equipment: EquipmentEntity | null = null;
  reading: EquipmentReading = {
    links: [],
    hasDefault: true,
    missingRoots: [],
    declared: {},
    web: false,
    node: "22.22.3",
    agents: [],
  };
  defaultSchema?: string;
  lockfileVersion?: string;
  readonly repairs: EquipmentRepair[] = [];
  readonly procedures = new Map<string, EquipmentProcedure>();
  readonly dotenvKeys = new Set<string>();
  readonly scripts = new Set<string>();
  readonly binaries = new Set<string>();
  readonly files = new Set<string>();

  findEquipment(): EquipmentEntity | null {
    return this.equipment;
  }

  async inspectEquipment(): Promise<EquipmentReading> {
    return this.reading;
  }

  repairEquipment(_root: string, installed: EquipmentEntity, repair: EquipmentRepair): void {
    const { reading } = this;
    this.repairs.push(repair);
    switch (repair.kind) {
      case RepairKind.Pin:
        reading.pinned = installed.version;
        this.lockfileVersion = installed.version;
        break;
      case RepairKind.Link:
        for (const link of reading.links.filter((link) => link.schema === repair.schema))
          link.holds = true;
        break;
      case RepairKind.Default:
        this.defaultSchema = installed.processes[0];
        reading.hasDefault = this.defaultSchema !== undefined;
        break;
      case RepairKind.Roots:
        reading.missingRoots = reading.missingRoots.filter((path) => !repair.paths.includes(path));
        break;
      case RepairKind.Instruction: {
        const agent = reading.agents.find((agent) => agent.instructionFile === repair.file);
        if (agent)
          agent.instructionText = new EquipmentInstallationService().withSection(
            repair.before,
            Object.values(installed.instructions),
          );
        break;
      }
    }
  }

  readNotes(_root: string, _installed: EquipmentEntity, env: Record<string, string | undefined> = {}): EquipmentNotes {
    return {
      missingKeys: [...this.procedures].flatMap(([slug, { file, keys = [] }]) =>
        keys.filter((name) => !env[name] && !this.dotenvKeys.has(name)).map((name) => ({ name, slug, file })),
      ),
      pendingApprovals: false,
    };
  }

  listProcedures(): Map<string, EquipmentProcedure> {
    return this.procedures;
  }

  async readHoldings(): Promise<EquipmentHoldings> {
    return {
      scripts: this.scripts,
      binaries: (name) => this.binaries.has(name),
      file: (path) => this.files.has(path.replace(/^.\//, "")),
    };
  }
}
