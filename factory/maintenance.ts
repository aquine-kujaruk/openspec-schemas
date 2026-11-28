import { consolidated } from "./production.ts";
import { products } from "./engineering.ts";
import { loadEnv } from "./shared/infrastructure/adapters/env.adapter.ts";
import { capture, INSTALLED, PROJECT_ROOT, SETUP_ASSETS } from "./shared/infrastructure/adapters/paths.adapter.ts";
import { runtime } from "./shared/infrastructure/adapters/runtime.adapter.ts";
import { MaintenanceController } from "./maintenance/framework/controllers/maintenance.controller.ts";
import { consoleIo } from "./shared/infrastructure/adapters/cli.adapter.ts";
import { MaintainEquipmentUseCase } from "./maintenance/application/use-cases/maintain-equipment.use-case.ts";
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
  readRules: async (root) => {
    const named = (await products.projectProducts(root)).map((product) => product.name).filter(Boolean);

    return (named.length ? named : [""]).flatMap((product) => {
      const result = capture("pnpm", ["exec", "factory", "rules", "--json", ...(product ? ["--product", product] : [])], { cwd: root });
      const last = result.stdout.trim().split("\n").at(-1) ?? "";

      try {
        const records = result.status === 0 ? JSON.parse(last) as unknown : [];

        return Array.isArray(records) ? records.map((record: object) => (product ? { ...record, product } : record)) : [];
      } catch {
        return [];
      }
    });
  },
});

const maintain = new MaintainEquipmentUseCase(new EquipmentRepositoryImplementation(resources));
const procedures = new SuspectProcedureService();

const controller = new MaintenanceController({
  maintain,
  root: PROJECT_ROOT,
  missingPackage: `no installed package found: install one with the agent package manager, so that an agent's skills hold ${SETUP_ASSETS}/${INSTALLED}`,
}, consoleIo);

export const maintainEquipment = controller.doctor.bind(controller);

export const installed = { PLACES, readInstalled: resources.readInstalled.bind(resources) };

export const doctor = {
  ...installed, SECTION,
  schemaLinkHolds: resources.schemaLinkHolds.bind(resources),
  unwiredGuards: resources.unwiredGuards.bind(resources),
  pinnedVersion: resources.pinnedVersion.bind(resources),
  withSection: installation.withSection.bind(installation),
  run: maintainEquipment,
};

export const suspects = {
  codeOf: procedures.codeOf.bind(procedures),
  runsOf: procedures.runsOf.bind(procedures),
  holdingsOf: resources.holdingsOf.bind(resources),
  suspectsOf: procedures.suspectsOf.bind(procedures),
};
