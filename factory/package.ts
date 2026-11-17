import { createGuardCommand } from "./package/framework/guard.ts";
import { createGateCommand } from "./package/framework/gate.ts";
import { createDoctorCommand } from "./package/framework/doctor.ts";
import type { Commands } from "./shared/domain/command.ts";
import { createCommands } from "./package/framework/commands.ts";
import { createDoctor } from "./package/application/doctor.ts";
import { createGate } from "./package/application/gate.ts";
import { createGuard } from "./package/application/guard.ts";
import { createSuspects } from "./package/application/suspects.ts";
import * as flow from "./flow.ts";
import * as shared from "./shared.ts";
import * as repository from "./repository.ts";
import {
  fileSystem,
  path,
  yaml,
  crypto,
} from "./package/infrastructure/adapters/resources.ts";
import { runtime } from "./shared/infrastructure/adapters/runtime.ts";
const suspects: typeof import("./package/domain/suspects.ts") = createSuspects({
  existsSync: fileSystem.existsSync,
  readFileSync: fileSystem.readFileSync,
  join: path.join,
});
const doctorPorts: Parameters<typeof createDoctor>[0] = {
  existsSync: fileSystem.existsSync,
  lstatSync: fileSystem.lstatSync,
  mkdirSync: fileSystem.mkdirSync,
  readFileSync: fileSystem.readFileSync,
  realpathSync: fileSystem.realpathSync,
  rmSync: fileSystem.rmSync,
  symlinkSync: fileSystem.symlinkSync,
  writeFileSync: fileSystem.writeFileSync,
  dirname: path.dirname,
  join: path.join,
  relative: path.relative,
  parse: yaml.parse,
  parseDocument: yaml.parseDocument,
  DECISIONS: flow.consolidated.DECISIONS,
  PROCEDURES: flow.consolidated.PROCEDURES,
  readConsolidated: flow.consolidated.readConsolidated,
  loadEnv: shared.env.loadEnv,
  capture: shared.paths.capture,
  COMMAND: shared.paths.COMMAND,
  INSTALLED: shared.paths.INSTALLED,
  PROJECT_ROOT: shared.paths.PROJECT_ROOT,
  SETUP_ASSETS: shared.paths.SETUP_ASSETS,
  projectProducts: repository.products.projectProducts,
  readProjectConfig: repository.products.readProjectConfig,
  holdingsOf: suspects.holdingsOf,
  suspectsOf: suspects.suspectsOf,
  PLACES: repository.installed.PLACES,
  readInstalled: repository.installed.readInstalled,
  environment: runtime.environment,
  nodeVersion: runtime.nodeVersion,
};
const doctorApplication = createDoctor(doctorPorts);
const doctor: typeof import("./package/domain/doctor.ts") = {
  ...doctorApplication,
  run: createDoctorCommand({ ...doctorPorts, ...doctorApplication }),
};
const guardPorts: Parameters<typeof createGuard>[0] = {
  existsSync: fileSystem.existsSync,
  readFileSync: fileSystem.readFileSync,
  dirname: path.dirname,
  isAbsolute: path.isAbsolute,
  join: path.join,
  relative: path.relative,
  resolve: path.resolve,
  CHANGES: flow.change.CHANGES,
  DECISIONS: flow.consolidated.DECISIONS,
  PROCEDURES: flow.consolidated.PROCEDURES,
  productRoots: repository.products.productRoots,
  productHolding: repository.products.productHolding,
  projectProducts: repository.products.projectProducts,
  changesInImplementation: flow.validate.changesInImplementation,
  environment: runtime.environment,
  workingDirectory: runtime.workingDirectory,
  interactive: runtime.interactive,
};
const guardApplication = createGuard(guardPorts);
const guard: typeof import("./package/domain/guard.ts") = {
  ...guardApplication,
  run: createGuardCommand({ ...guardPorts, ...guardApplication }),
};
const gatePorts: Parameters<typeof createGate>[0] = {
  createHash: crypto.createHash,
  existsSync: fileSystem.existsSync,
  readFileSync: fileSystem.readFileSync,
  rmSync: fileSystem.rmSync,
  writeFileSync: fileSystem.writeFileSync,
  join: path.join,
  parse: yaml.parse,
  CHANGES: flow.change.CHANGES,
  GATE: flow.change.GATE,
  PLACES: doctor.PLACES,
  readInstalled: doctor.readInstalled,
  schemaLinkHolds: doctor.schemaLinkHolds,
  unwiredGuards: doctor.unwiredGuards,
  hookInput: guard.hookInput,
  projectOf: guard.projectOf,
  capture: shared.paths.capture,
  self: shared.paths.self,
  loadSchema: repository.schema.loadSchema,
  productOf: repository.products.productOf,
  changesInImplementation: flow.validate.changesInImplementation,
  environment: runtime.environment,
  workingDirectory: runtime.workingDirectory,
};
const gateApplication = createGate(gatePorts);
const gate: typeof import("./package/domain/gate.ts") = {
  ...gateApplication,
  run: createGateCommand({ ...gatePorts, ...gateApplication }),
};
export { doctor, gate, guard, suspects };

export const commands: Commands = createCommands({
  doctor: doctor.run,
  guard: guard.run,
  gate: gate.run,
});
