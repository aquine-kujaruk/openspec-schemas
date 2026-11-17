import { createVerifyCommand } from "./flow/framework/verify.ts";
import { createValidateCommand } from "./flow/framework/validate.ts";
import { createReadingCommand } from "./flow/framework/reading.ts";
import { createImplementCommand } from "./flow/framework/implement.ts";
import { createHandoffCommand } from "./flow/framework/handoff.ts";
import { createFeedbackCommand } from "./flow/framework/feedback.ts";
import { createArchiveCommand } from "./flow/framework/archive.ts";
import type { Commands } from "./shared/domain/command.ts";
import { createCommands } from "./flow/framework/commands.ts";
import { createArchive } from "./flow/application/archive.ts";
import { createChange } from "./flow/application/change.ts";
import { createConsolidated } from "./flow/application/consolidated.ts";
import { createEvidence } from "./flow/application/evidence.ts";
import { createFeedback } from "./flow/application/feedback.ts";
import { createHandoff } from "./flow/application/handoff.ts";
import { createImplement } from "./flow/application/implement.ts";
import { createMerged } from "./flow/application/merged.ts";
import * as plan from "./shared/domain/plan.ts";
import { createReading } from "./flow/application/reading.ts";
import { createValidate } from "./flow/application/validate.ts";
import { createVerify } from "./flow/application/verify.ts";
import * as shared from "./shared.ts";
import * as repository from "./repository.ts";
import {
  fileSystem,
  path,
  yaml,
  crypto,
  operatingSystem,
  processes,
} from "./flow/infrastructure/adapters/resources.ts";
import { runtime } from "./shared/infrastructure/adapters/runtime.ts";
const change: typeof import("./shared/domain/change.ts") = createChange({
  existsSync: fileSystem.existsSync,
  globSync: fileSystem.globSync,
  readdirSync: fileSystem.readdirSync,
  readFileSync: fileSystem.readFileSync,
  join: path.join,
  parse: yaml.parse,
});
const consolidated: typeof import("./shared/domain/consolidated.ts") =
  createConsolidated({
    globSync: fileSystem.globSync,
    readFileSync: fileSystem.readFileSync,
    join: path.join,
    tagsOf: plan.tagsOf,
  });
const feedbackPorts: Parameters<typeof createFeedback>[0] = {
  existsSync: fileSystem.existsSync,
  readFileSync: fileSystem.readFileSync,
  rmSync: fileSystem.rmSync,
  writeFileSync: fileSystem.writeFileSync,
  join: path.join,
  activeChanges: change.activeChanges,
  CHANGES: change.CHANGES,
  GATE: change.GATE,
  PROJECT_ROOT: shared.paths.PROJECT_ROOT,
};
const feedbackApplication = createFeedback(feedbackPorts);
const feedback: typeof import("./flow/domain/feedback.ts") = {
  ...feedbackApplication,
  run: createFeedbackCommand({ ...feedbackPorts, ...feedbackApplication }),
};
const evidence: typeof import("./flow/domain/evidence.ts") = createEvidence({
  createHash: crypto.createHash,
  existsSync: fileSystem.existsSync,
  globSync: fileSystem.globSync,
  readFileSync: fileSystem.readFileSync,
  writeFileSync: fileSystem.writeFileSync,
  join: path.join,
  parse: yaml.parse,
  stringify: yaml.stringify,
  CHANGES: change.CHANGES,
  readChange: change.readChange,
  productRoots: repository.products.productRoots,
  productOf: repository.products.productOf,
});
const readingPorts: Parameters<typeof createReading>[0] = {
  createHash: crypto.createHash,
  existsSync: fileSystem.existsSync,
  mkdirSync: fileSystem.mkdirSync,
  readFileSync: fileSystem.readFileSync,
  statSync: fileSystem.statSync,
  writeFileSync: fileSystem.writeFileSync,
  tmpdir: operatingSystem.tmpdir,
  basename: path.basename,
  dirname: path.dirname,
  isAbsolute: path.isAbsolute,
  join: path.join,
  relative: path.relative,
  resolve: path.resolve,
  PROJECT_ROOT: shared.paths.PROJECT_ROOT,
  loadEnv: shared.env.loadEnv,
  readProjectConfig: repository.products.readProjectConfig,
  environment: runtime.environment,
};
const readingApplication = createReading(readingPorts);
const reading: typeof import("./flow/domain/reading.ts") = {
  ...readingApplication,
  run: createReadingCommand({ ...readingPorts, ...readingApplication }),
};
const validatePorts: Parameters<typeof createValidate>[0] = {
  activeChanges: change.activeChanges,
  isStarted: change.isStarted,
  readArchivedChange: change.readArchivedChange,
  readChange: change.readChange,
  readConsolidated: consolidated.readConsolidated,
  PROJECT_ROOT: shared.paths.PROJECT_ROOT,
  parsePlan: plan.parsePlan,
  loadSchema: repository.schema.loadSchema,
  schemaNames: repository.schema.schemaNames,
  readProjectConfig: repository.products.readProjectConfig,
};
const validateApplication = createValidate(validatePorts);
const validate: typeof import("./flow/domain/validate.ts") = {
  ...validateApplication,
  validate: createValidateCommand({ ...validatePorts, ...validateApplication }),
};
const handoffPorts: Parameters<typeof createHandoff>[0] = {
  spawnSync: processes.spawnSync,
  PROJECT_ROOT: shared.paths.PROJECT_ROOT,
  readProjectConfig: repository.products.readProjectConfig,
  NotValidatable: validate.NotValidatable,
  validateChange: validate.validateChange,
};
const handoffApplication = createHandoff(handoffPorts);
const handoff: typeof import("./flow/domain/handoff.ts") = {
  ...handoffApplication,
  run: createHandoffCommand({ ...handoffPorts, ...handoffApplication }),
};
const implementPorts: Parameters<typeof createImplement>[0] = {
  writeFileSync: fileSystem.writeFileSync,
  join: path.join,
  activeChanges: change.activeChanges,
  CHANGES: change.CHANGES,
  GATE: change.GATE,
  readChange: change.readChange,
  PROJECT_ROOT: shared.paths.PROJECT_ROOT,
  self: shared.paths.self,
  parsePlan: plan.parsePlan,
  loadSchema: repository.schema.loadSchema,
  NotValidatable: validate.NotValidatable,
  validateChange: validate.validateChange,
};
const implementApplication = createImplement(implementPorts);
const implement: typeof import("./flow/domain/implement.ts") = {
  ...implementApplication,
  run: createImplementCommand({ ...implementPorts, ...implementApplication }),
};
const merged: typeof import("./flow/domain/merged.ts") = createMerged({
  cpSync: fileSystem.cpSync,
  existsSync: fileSystem.existsSync,
  mkdirSync: fileSystem.mkdirSync,
  mkdtempSync: fileSystem.mkdtempSync,
  realpathSync: fileSystem.realpathSync,
  rmSync: fileSystem.rmSync,
  symlinkSync: fileSystem.symlinkSync,
  tmpdir: operatingSystem.tmpdir,
  join: path.join,
  activeChanges: change.activeChanges,
  CHANGES: change.CHANGES,
  readChange: change.readChange,
  COMMAND: shared.paths.COMMAND,
  runTool: shared.paths.runTool,
  NotValidatable: validate.NotValidatable,
  validateChange: validate.validateChange,
  environment: runtime.environment,
});
const archivePorts: Parameters<typeof createArchive>[0] = {
  existsSync: fileSystem.existsSync,
  mkdirSync: fileSystem.mkdirSync,
  readFileSync: fileSystem.readFileSync,
  renameSync: fileSystem.renameSync,
  rmSync: fileSystem.rmSync,
  writeFileSync: fileSystem.writeFileSync,
  dirname: path.dirname,
  join: path.join,
  activeChanges: change.activeChanges,
  CHANGES: change.CHANGES,
  readChange: change.readChange,
  DECISIONS: consolidated.DECISIONS,
  PROCEDURES: consolidated.PROCEDURES,
  readConsolidated: consolidated.readConsolidated,
  digestOf: evidence.digestOf,
  readEvidence: evidence.readEvidence,
  raise: feedback.raise,
  openspec: merged.openspec,
  DEVELOPING: shared.paths.DEVELOPING,
  PROJECT_ROOT: shared.paths.PROJECT_ROOT,
  self: shared.paths.self,
  operationsOf: plan.operationsOf,
  parsePlan: plan.parsePlan,
  tagOf: plan.tagOf,
  NotValidatable: validate.NotValidatable,
  validateChange: validate.validateChange,
};
const archiveApplication = createArchive(archivePorts);
const archive: typeof import("./flow/domain/archive.ts") = {
  ...archiveApplication,
  run: createArchiveCommand({ ...archivePorts, ...archiveApplication }),
};
const verifyPorts: Parameters<typeof createVerify>[0] = {
  existsSync: fileSystem.existsSync,
  readFileSync: fileSystem.readFileSync,
  rmSync: fileSystem.rmSync,
  join: path.join,
  matchesGlob: path.matchesGlob,
  layoutOf: repository.generated.layoutOf,
  testOf: repository.generated.testOf,
  loadEnv: shared.env.loadEnv,
  activeChanges: change.activeChanges,
  readChange: change.readChange,
  digestOf: evidence.digestOf,
  writeEvidence: evidence.writeEvidence,
  raise: feedback.raise,
  cacheDir: shared.paths.cacheDir,
  capture: shared.paths.capture,
  PROJECT_ROOT: shared.paths.PROJECT_ROOT,
  self: shared.paths.self,
  parsePlan: plan.parsePlan,
  tagOf: plan.tagOf,
  loadSchema: repository.schema.loadSchema,
  schemaNames: repository.schema.schemaNames,
  productOf: repository.products.productOf,
  environment: runtime.environment,
};
const verifyApplication = createVerify(verifyPorts);
const verify: typeof import("./flow/domain/verify.ts") = {
  ...verifyApplication,
  run: createVerifyCommand({ ...verifyPorts, ...verifyApplication }),
};
export {
  archive,
  change,
  consolidated,
  evidence,
  feedback,
  handoff,
  implement,
  merged,
  plan,
  reading,
  validate,
  verify,
};

export const commands: Commands = createCommands({
  implement: implement.run,
  handoff: handoff.run,
  reading: reading.run,
  feedback: feedback.run,
  verify: verify.run,
  archive: archive.run,
  validate: validate.validate,
});
export const sdkValidateChange: typeof validate.validateChange =
  validate.validateChange;
