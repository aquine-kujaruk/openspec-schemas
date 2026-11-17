import { consolidated } from "./production.ts";
import { products } from "./engineering.ts";
import { loadEnv } from "./shared/infrastructure/adapters/env.adapter.ts";
import { capture, INSTALLED, PROJECT_ROOT, SETUP_ASSETS } from "./shared/infrastructure/adapters/paths.adapter.ts";
import { runtime } from "./shared/infrastructure/adapters/runtime.adapter.ts";
import { MaintainEquipmentUseCase } from "./maintenance/application/use-cases/maintain-equipment.use-case.ts";
import type { MaintenanceOptions } from "./maintenance/application/repository-interfaces/equipment.repository-interface.ts";
import { MaintenanceKind } from "./maintenance/domain/schemas/maintenance-item.schema.ts";
import { EquipmentInstallationService, SECTION } from "./maintenance/domain/services/equipment-installation.service.ts";
import { SuspectProcedureService } from "./maintenance/domain/services/suspect-procedure.service.ts";
import { PLACES } from "./maintenance/infrastructure/acl/equipment.acl.ts";
import { EquipmentAdapter } from "./maintenance/infrastructure/adapters/equipment.adapter.ts";
import { EquipmentRepositoryImplementation } from "./maintenance/infrastructure/repository-implementations/equipment.repository-implementation.ts";

const installation = new EquipmentInstallationService();
const resources = new EquipmentAdapter({
  readProcedures: (root) => consolidated.readConsolidated(root).procedures,
  listProductRoots: async (root) => Object.values((await products.readProjectConfig(root))?.products ?? {}).map((product) => product.root),
  hasWebProduct: async (root) => (await products.projectProducts(root)).some((product) => product.config.platform.name === "web"),
  environment: runtime.environment,
  nodeVersion: runtime.nodeVersion,
  loadEnv,
  run: (command, args, cwd) => capture(command, args, { cwd }),
  withSection: (own, instructions) => installation.withSection(own, instructions),
  pinnedVersion: (command, manifest, lock) => installation.pinnedVersion(command, manifest, lock),
});
const maintain = new MaintainEquipmentUseCase(new EquipmentRepositoryImplementation(resources));
const procedures = new SuspectProcedureService();

export type DoctorReport = {
  items: Array<{
    requirement: string;
    agent?: string;
    report: "missing" | "drift" | "repaired";
    detail: string;
  }>;
  notes: string[];
  suspects: string[];
  status: 0 | 1;
};

const maintainAt = async (root: string, options?: MaintenanceOptions): Promise<DoctorReport | undefined> => {
  const report = await maintain.execute(root, options);
  if (!report) return undefined;
  return {
    items: report.items.flatMap(({ kind, requirement, agent, detail, repaired }) =>
      kind === MaintenanceKind.Missing || kind === MaintenanceKind.Drift
        ? [{ requirement, ...(agent === undefined ? {} : { agent }), detail, report: repaired ? "repaired" : kind }]
        : [],
    ),
    notes: report.items.filter((item) => item.kind === MaintenanceKind.Note).map((item) => item.detail),
    suspects: report.items.filter((item) => item.kind === MaintenanceKind.Suspect).map((item) => item.detail),
    status: report.status,
  };
};

export async function maintainEquipment(args: string[]): Promise<number> {
  const report = await maintainAt(PROJECT_ROOT, { fix: args.includes("--fix") });
  if (!report) {
    console.error(
      `no installed package found: install one with the agent package manager, so that an agent's skills hold ${SETUP_ASSETS}/${INSTALLED}`,
    );
    return 2;
  }
  for (const item of report.items) {
    console.log(`${item.report}: ${item.requirement}${item.agent ? ` for ${item.agent}` : ""} — ${item.detail}`);
  }
  if (!report.items.length) console.log("nothing is lacking");
  for (const note of report.notes) console.log(`note: ${note}`);
  for (const suspect of report.suspects) console.log(`suspect: ${suspect}`);
  return report.status;
}

export const installed = { PLACES, readInstalled: resources.readInstalled.bind(resources) };

export const doctor = {
  ...installed, SECTION,
  schemaLinkHolds: resources.schemaLinkHolds.bind(resources),
  unwiredGuards: resources.unwiredGuards.bind(resources),
  pinnedVersion: resources.pinnedVersion.bind(resources),
  withSection: installation.withSection.bind(installation),
  doctor: maintainAt,
  run: maintainEquipment,
};

export const suspects = {
  codeOf: procedures.codeOf.bind(procedures),
  runsOf: procedures.runsOf.bind(procedures),
  holdingsOf: resources.holdingsOf.bind(resources),
  suspectsOf: procedures.suspectsOf.bind(procedures),
};
