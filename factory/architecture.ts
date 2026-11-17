import { createReviewCliCommand } from "./architecture/framework/review-cli.ts";
import type { Commands } from "./shared/domain/command.ts";
import { createCommands } from "./architecture/framework/commands.ts";
import * as archunit from "./architecture/domain/archunit.ts";
import { createCheck } from "./architecture/application/check.ts";
import * as compose from "./architecture/domain/compose.ts";
import { createExampleFile } from "./architecture/application/example-file.ts";
import { createExamples } from "./architecture/application/examples.ts";
import { createExpectFile } from "./architecture/application/expect-file.ts";
import { createExpectations } from "./architecture/application/expectations.ts";
import { createGenerate } from "./architecture/application/generate.ts";
import * as graph from "./architecture/domain/graph.ts";
import * as oxlint from "./architecture/domain/oxlint.ts";
import { createPrepare } from "./architecture/application/prepare.ts";
import { createProject } from "./architecture/application/project.ts";
import { createReviewCli } from "./architecture/application/review-cli.ts";
import * as reviewClient from "./architecture/infrastructure/adapters/review-client.ts";
import * as reviewDefaults from "./architecture/domain/review-defaults.ts";
import * as reviewFakeClient from "./architecture/domain/review-fake-client.ts";
import * as reviewFunnel from "./architecture/domain/review-funnel.ts";
import { createReviewRecord } from "./architecture/application/review-record.ts";
import { createReviewReview } from "./architecture/application/review-review.ts";
import { createReviewRubric } from "./architecture/application/review-rubric.ts";
import * as reviewUnits from "./architecture/domain/review-units.ts";
import { createRules } from "./architecture/application/rules.ts";
import { createTest } from "./architecture/application/test.ts";
import * as shared from "./shared.ts";
import * as repository from "./repository.ts";
import * as flow from "./flow.ts";
import {
  fileSystem,
  assertions,
  path,
  crypto,
  archunitTool,
  operatingSystem,
  processes,
} from "./architecture/infrastructure/adapters/resources.ts";
import { runtime } from "./shared/infrastructure/adapters/runtime.ts";
const expectFile: typeof import("./architecture/domain/expect-file.ts") =
  createExpectFile({});
const exampleFile: typeof import("./architecture/domain/example-file.ts") =
  createExampleFile({
    readFileSync: fileSystem.readFileSync,
    findingLines: expectFile.findingLines,
    parseFindingLines: expectFile.parseFindingLines,
  });
const expectations: typeof import("./architecture/domain/expectations.ts") =
  createExpectations({
    deepStrictEqual: assertions.deepStrictEqual,
    parseExampleFile: exampleFile.parseExampleFile,
    findingLines: expectFile.findingLines,
  });
const prepare: typeof import("./architecture/domain/prepare.ts") =
  createPrepare({
    existsSync: fileSystem.existsSync,
    mkdirSync: fileSystem.mkdirSync,
    join: path.join,
  });
const reviewRecord: typeof import("./architecture/domain/review-record.ts") =
  createReviewRecord({
    createHash: crypto.createHash,
    existsSync: fileSystem.existsSync,
    readFileSync: fileSystem.readFileSync,
    writeFileSync: fileSystem.writeFileSync,
    join: path.join,
  });
const reviewReview: typeof import("./architecture/domain/review-review.ts") =
  createReviewReview({
    globSync: fileSystem.globSync,
    readFileSync: fileSystem.readFileSync,
    join: path.join,
    relative: path.relative,
    funnel: reviewFunnel.funnel,
    emptyRecord: reviewRecord.emptyRecord,
    recordPass: reviewRecord.recordPass,
    rubricHash: reviewRecord.rubricHash,
    touched: reviewRecord.touched,
    DEFAULTS: reviewDefaults.DEFAULTS,
  });
const reviewRubric: typeof import("./architecture/domain/review-rubric.ts") =
  createReviewRubric({
    readFileSync: fileSystem.readFileSync,
    join: path.join,
  });
const project: typeof import("./architecture/domain/project.ts") =
  createProject({
    globSync: fileSystem.globSync,
    readdirSync: fileSystem.readdirSync,
    join: path.join,
    loadWorkstreams: graph.loadWorkstreams,
    PROJECT_ROOT: shared.paths.PROJECT_ROOT,
    SOURCE_EXT: shared.paths.SOURCE_EXT,
    loadHolder: repository.schema.loadHolder,
    currentProduct: repository.products.currentProduct,
  });
const reviewCliPorts: Parameters<typeof createReviewCli>[0] = {
  capture: shared.paths.capture,
  PROJECT_ROOT: shared.paths.PROJECT_ROOT,
  architecture: project.architecture,
  RUBRICS: project.RUBRICS,
  openAiClient: reviewClient.openAiClient,
  loadEnv: shared.env.loadEnv,
  readRecord: reviewRecord.readRecord,
  writeRecord: reviewRecord.writeRecord,
  DEFAULTS: reviewReview.DEFAULTS,
  review: reviewReview.review,
  readRubric: reviewRubric.readRubric,
  environment: runtime.environment,
};
const reviewCliApplication = createReviewCli(reviewCliPorts);
const reviewCli: typeof import("./architecture/domain/review-cli.ts") = {
  ...reviewCliApplication,
  run: createReviewCliCommand({ ...reviewCliPorts, ...reviewCliApplication }),
};
const rules: typeof import("./architecture/domain/rules.ts") = createRules({
  existsSync: fileSystem.existsSync,
  writeFileSync: fileSystem.writeFileSync,
  join: path.join,
  projectFiles: archunitTool.projectFiles,
  COVERAGE_RULE: compose.COVERAGE_RULE,
  layersOf: compose.layersOf,
  oxlintOverrides: compose.oxlintOverrides,
  withUpstream: graph.withUpstream,
  cacheDir: shared.paths.cacheDir,
  product: project.product,
  workingDirectory: runtime.workingDirectory,
});
const examples: typeof import("./architecture/domain/examples.ts") =
  createExamples({
    globSync: fileSystem.globSync,
    mkdirSync: fileSystem.mkdirSync,
    mkdtempSync: fileSystem.mkdtempSync,
    writeFileSync: fileSystem.writeFileSync,
    tmpdir: operatingSystem.tmpdir,
    basename: path.basename,
    dirname: path.dirname,
    join: path.join,
    clearGraphCache: archunitTool.clearGraphCache,
    COVERAGE_RULE: compose.COVERAGE_RULE,
    fallowConfig: compose.fallowConfig,
    layersOf: compose.layersOf,
    oxlintConfig: compose.oxlintConfig,
    oxlintOverrides: compose.oxlintOverrides,
    withUpstream: graph.withUpstream,
    archunitRules: rules.archunitRules,
    idsInMessages: rules.idsInMessages,
    parseExampleFile: exampleFile.parseExampleFile,
    jsonOf: shared.paths.jsonOf,
    runTool: shared.paths.runTool,
    workingDirectory: runtime.workingDirectory,
    changeDirectory: runtime.changeDirectory,
  });
const test: typeof import("./architecture/domain/test.ts") = createTest({
  spawnSync: processes.spawnSync,
  existsSync: fileSystem.existsSync,
  readFileSync: fileSystem.readFileSync,
  rmSync: fileSystem.rmSync,
  writeFileSync: fileSystem.writeFileSync,
  basename: path.basename,
  join: path.join,
  cacheDir: shared.paths.cacheDir,
  PROJECT_ROOT: shared.paths.PROJECT_ROOT,
  config: project.config,
  product: project.product,
  environment: runtime.environment,
  nodeExecutable: runtime.nodeExecutable,
});
const generate: typeof import("./architecture/domain/generate.ts") =
  createGenerate({
    existsSync: fileSystem.existsSync,
    globSync: fileSystem.globSync,
    mkdirSync: fileSystem.mkdirSync,
    readFileSync: fileSystem.readFileSync,
    rmSync: fileSystem.rmSync,
    basename: path.basename,
    dirname: path.dirname,
    join: path.join,
    relative: path.relative,
    layoutOf: repository.generated.layoutOf,
    testOf: repository.generated.testOf,
    mergedSpecs: flow.merged.mergedSpecs,
    DEVELOPING: shared.paths.DEVELOPING,
    PROJECT_ROOT: shared.paths.PROJECT_ROOT,
    runTool: shared.paths.runTool,
    config: project.config,
    loadSchema: repository.schema.loadSchema,
    schemaNames: repository.schema.schemaNames,
    emitSchema: repository.schemaYaml.emitSchema,
    schemaFiles: repository.schemaYaml.schemaFiles,
  });
const check: typeof import("./architecture/domain/check.ts") = createCheck({
  globSync: fileSystem.globSync,
  writeFileSync: fileSystem.writeFileSync,
  join: path.join,
  COVERAGE_RULE: compose.COVERAGE_RULE,
  fallowConfig: compose.fallowConfig,
  oxlintConfig: compose.oxlintConfig,
  fileOf: examples.fileOf,
  generate: generate.generate,
  withUpstream: graph.withUpstream,
  cacheDir: shared.paths.cacheDir,
  jsonOf: shared.paths.jsonOf,
  PROJECT_ROOT: shared.paths.PROJECT_ROOT,
  runTool: shared.paths.runTool,
  architecture: project.architecture,
  config: project.config,
  product: project.product,
  archunitRules: rules.archunitRules,
});
export {
  archunit,
  check,
  compose,
  exampleFile,
  examples,
  expectFile,
  expectations,
  generate,
  graph,
  oxlint,
  prepare,
  project,
  reviewCli,
  reviewClient,
  reviewDefaults,
  reviewFakeClient,
  reviewFunnel,
  reviewRecord,
  reviewReview,
  reviewRubric,
  reviewUnits,
  rules,
  test,
};

export const commands: Commands = createCommands({
  check: async (args) => {
    await project.initialize();
    return check.check(args);
  },
  generate: async (args) => {
    await project.initialize();
    return generate.generate(args);
  },
  test: async (args) => {
    await project.initialize();
    return test.test(args);
  },
  review: async (args) => {
    await project.initialize();
    return reviewCli.run();
  },
  prepare: async () => {
    await project.initialize();
    return (async () => {
      const created = prepare.prepare(
        shared.paths.PROJECT_ROOT,
        project.config,
      );
      console.log(
        created.length
          ? created.map((d) => `created ${d}`).join("\n")
          : "nothing to prepare",
      );
      return 0;
    })();
  },
});
export const sdkArchitecture: typeof project.architecture =
  project.architecture;
export const sdkExampleArchitecture: typeof project.exampleArchitecture =
  project.exampleArchitecture;
export const sdkExamples: typeof examples.examples = examples.examples;
export const sdkExpectations: typeof expectations.expectations =
  expectations.expectations;
export const sdkRuleIds: typeof rules.ruleIds = rules.ruleIds;
