import { QualityController } from "./quality/framework/controllers/quality.controller.ts";
import { consoleIo, toStandardError } from "./shared/infrastructure/adapters/cli.adapter.ts";
import { createCheck } from "./quality/infrastructure/adapters/inspection.adapter.ts";
import * as compose from "./quality/infrastructure/adapters/inspection-config.adapter.ts";
import { createExampleFile } from "./quality/infrastructure/adapters/sample-file.adapter.ts";
import { createExamples } from "./quality/infrastructure/adapters/sample-inspection.adapter.ts";
import { createExpectFile } from "./quality/infrastructure/adapters/sample-expected.adapter.ts";
import { createExpectations } from "./quality/infrastructure/adapters/sample-proof.adapter.ts";
import { createGenerate } from "./quality/infrastructure/adapters/drawing.adapter.ts";
import { createRules } from "./quality/infrastructure/adapters/standard-check.adapter.ts";
import { createTest } from "./quality/infrastructure/adapters/gauge-run.adapter.ts";
import * as shared from "./shared.ts";
import * as fileSystem from "node:fs";
import * as path from "node:path";
import { projectFiles, clearGraphCache } from "archunit";
import { tmpdir } from "node:os";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { createGenerated } from "./quality/infrastructure/adapters/gauge-layout.adapter.ts";
import { graph, products, project, schema, schemaYaml } from "./engineering.ts";
import { runtime } from "./shared/infrastructure/adapters/runtime.adapter.ts";

import { MakeGaugesUseCase } from "./quality/application/use-cases/make-gauges.use-case.ts";
import { RunGaugesUseCase } from "./quality/application/use-cases/run-gauges.use-case.ts";
import { RunQualityControlUseCase } from "./quality/application/use-cases/run-quality-control.use-case.ts";
import type { DrawingRecord } from "./quality/infrastructure/acl/drawing.acl.ts";
import type { InspectionRecord } from "./quality/infrastructure/acl/inspection.acl.ts";
import { DrawingRepositoryImplementation } from "./quality/infrastructure/repository-implementations/drawing.repository-implementation.ts";
import { GaugeRunRepositoryImplementation } from "./quality/infrastructure/repository-implementations/gauge-run.repository-implementation.ts";
import { InspectionRepositoryImplementation } from "./quality/infrastructure/repository-implementations/inspection.repository-implementation.ts";

import { change, feedback, merged, plan, validate } from "./production.ts";
import { doctor } from "./maintenance.ts";
import { hookInput, projectOf } from "./change-control.ts";
import { InspectWorkOrderUseCase, type InspectionOptions } from "./quality/application/use-cases/inspect-work-order.use-case.ts";
import { HoldStageUseCase } from "./quality/application/use-cases/hold-stage.use-case.ts";
import { QualityException } from "./quality/domain/exceptions/quality.exceptions.ts";
import { RulesRecordSchema, type RulesLedger } from "./quality/domain/schemas/rules-ledger.schema.ts";
import type { InspectionCertificateRecord } from "./quality/infrastructure/acl/final-inspection.acl.ts";
import { FinalInspectionAdapter, scenariosOfDelta } from "./quality/infrastructure/adapters/final-inspection.adapter.ts";
import { QualityCertificateFileAdapter } from "./quality/infrastructure/adapters/quality-certificate-file.adapter.ts";
import { StageHoldAdapter } from "./quality/infrastructure/adapters/stage-hold.adapter.ts";
import { FinalInspectionRepositoryImplementation } from "./quality/infrastructure/repository-implementations/final-inspection.repository-implementation.ts";
import { StageHoldRepositoryImplementation } from "./quality/infrastructure/repository-implementations/stage-hold.repository-implementation.ts";
import { loadEnv } from "./shared/infrastructure/adapters/env.adapter.ts";
import { capture, PROJECT_ROOT } from "./shared/infrastructure/adapters/paths.adapter.ts";

import type { Review } from "./shared/domain/schemas/line-types.schema.ts";
import { createRubricCases } from "./quality/infrastructure/adapters/rubric-case.adapter.ts";
import { AuditRubricService } from "./quality/domain/services/audit-rubric.service.ts";
import { AuditUseCase } from "./quality/application/use-cases/audit.use-case.ts";
import { AuditAdapter } from "./quality/infrastructure/adapters/audit.adapter.ts";
import { openAiClient } from "./quality/infrastructure/adapters/audit-decision.adapter.ts";
import { AuditRepositoryImplementation } from "./quality/infrastructure/repository-implementations/audit.repository-implementation.ts";

const generated: typeof import("./quality/infrastructure/adapters/gauge-layout-contract.adapter.ts") =
  createGenerated({
    globSync: fileSystem.globSync,
    basename: path.basename,
    dirname: path.dirname,
    join: path.join,
    relative: path.relative,
    ARCHITECTURE_SPECS: shared.paths.ARCHITECTURE_SPECS,
    PACKAGE_ROOT: shared.paths.PACKAGE_ROOT,
    SOURCE_EXT: shared.paths.SOURCE_EXT,
    productOf: products.productOf,
    holderNames: schema.holderNames,
    loadHolder: schema.loadHolder,
  });

const expectFile: typeof import("./quality/infrastructure/adapters/sample-expected-contract.adapter.ts") =
  createExpectFile();

const exampleFile: typeof import("./quality/infrastructure/adapters/sample-file-contract.adapter.ts") =
  createExampleFile({
    readFileSync: fileSystem.readFileSync,
    findingLines: expectFile.findingLines,
    parseFindingLines: expectFile.parseFindingLines,
  });

const expectations: typeof import("./quality/infrastructure/adapters/sample-proof-contract.adapter.ts") =
  createExpectations({
    parseExampleFile: exampleFile.parseExampleFile,
    findingLines: expectFile.findingLines,
  });

const rules: typeof import("./quality/infrastructure/adapters/standard-check-contract.adapter.ts") = createRules({
  existsSync: fileSystem.existsSync,
  writeFileSync: fileSystem.writeFileSync,
  join: path.join,
  projectFiles,
  COVERAGE_RULE: compose.COVERAGE_RULE,
  layersOf: compose.layersOf,
  oxlintOverrides: compose.oxlintOverrides,
  withUpstream: graph.withUpstream,
  cacheDir: shared.paths.cacheDir,
  product: project.product,
  workingDirectory: runtime.workingDirectory,
  readFileSync: fileSystem.readFileSync,
  digest: (text) => createHash("sha256").update(text).digest("hex").slice(0, 16),
});

const examples: typeof import("./quality/infrastructure/adapters/sample-inspection-contract.adapter.ts") =
  createExamples({
    globSync: fileSystem.globSync,
    mkdirSync: fileSystem.mkdirSync,
    mkdtempSync: fileSystem.mkdtempSync,
    writeFileSync: fileSystem.writeFileSync,
    tmpdir,
    basename: path.basename,
    dirname: path.dirname,
    join: path.join,
    clearGraphCache,
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

const test = createTest({
  spawnSync,
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

const generate =
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
    layoutOf: generated.layoutOf,
    testOf: generated.testOf,
    rubricExamples: (dir, layer) => {
      const source = path.join(dir, layer + ".examples.md");
      if (!fileSystem.existsSync(source)) return "";

      const rows = [...exampleFile.parseExampleFile(source).rubric].flatMap(([row, cases]) =>
        [...cases].map(([name, sample]) => `        | ${row} | ${name} | ${sample.expectedVerdict} |`));

      if (!rows.length) return "";

      return [
        "", "  Rule: Recorded rubric judgements", "",
        "    Scenario Outline: rubric <row> / <example> is <verdict>",
        "      Given the example `<example>` <!-- exampleFolder -->",
        "      When rubric row `<row>` is judged <!-- rubricJudged -->",
        "      Then its verdict is `<verdict>` <!-- rubricVerdict -->", "",
        "      Examples:", "        | row | example | verdict |", ...rows, "",
      ].join("\n");
    },
    productTestOf: generated.productTestOf,
    mergedSpecs: merged.mergedSpecs,
    DEVELOPING: shared.paths.DEVELOPING,
    PROJECT_ROOT: shared.paths.PROJECT_ROOT,
    runTool: shared.paths.runTool,
    config: project.config,
    loadSchema: schema.loadSchema,
    schemaNames: schema.schemaNames,
    emitSchema: schemaYaml.emitSchema,
    schemaFiles: schemaYaml.schemaFiles,
  });

const check = createCheck({
  globSync: fileSystem.globSync,
  writeFileSync: fileSystem.writeFileSync,
  join: path.join,
  resolve: path.resolve,
  sep: path.sep,
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

const newGauges = new MakeGaugesUseCase(new DrawingRepositoryImplementation(
  async (args) => {
    await project.initialize();
    const drawings: DrawingRecord[] = [];
    const exitStatus = await generate.generate([...args], (drawing) => drawings.push(drawing));

    return { exitStatus, drawings };
  },
));

const gaugeRun = new RunGaugesUseCase(new GaugeRunRepositoryImplementation(
  async (args) => {
    await project.initialize();

    return test.test([...args]);
  },
));

const inspection = new RunQualityControlUseCase(new InspectionRepositoryImplementation(
  async (_line, scope) => {
    const defects: InspectionRecord["defects"] = [];
    const exitStatus = await check.check([...scope], (finding) => defects.push(finding));

    return { defects, exitStatus };
  },
));



const rulesRecord = () => path.join(shared.paths.PROJECT_ROOT, project.product.root, ".factory-rules.json");
const installedLedger = () => rules.ledger(project.architecture, project.EXAMPLE_FILES, project.RUBRICS);

const recordedLedger = (): RulesLedger | undefined =>
  fileSystem.existsSync(rulesRecord())
    ? RulesRecordSchema.parse(JSON.parse(fileSystem.readFileSync(rulesRecord(), "utf8"))).rules
    : undefined;

const auditOf = async () => {
  const config = project.architecture.review;
  const root = PROJECT_ROOT;
  const key = loadEnv(root, runtime.environment())[config.keyVariable];
  const client = openAiClient({ key: key ?? "", model: config.model, onIssue: (issue) => consoleIo.warn(`model: ${issue}`) });

  const source = new AuditAdapter(
    (state, questions) => client.ask(state, questions),
    (at) => {
      const result = capture("git", ["rev-parse", "HEAD"], { cwd: at });

      return result.status === 0 ? result.stdout.trim() : null;
    },
  );

  return {
    useCase: new AuditUseCase(new AuditRepositoryImplementation(source)),
    input: { root, modules: project.config.modules, rubrics: project.RUBRICS, config, key },
  };
};

export function judgements(layer: string, dir: string) {
  const config = project.config.review;
  const key = loadEnv(PROJECT_ROOT, runtime.environment())[config.keyVariable];
  const client = key ? openAiClient({ key, model: config.model }) : undefined;
  const adapter = new AuditAdapter(async () => new Map(), () => null);

  const rows = new AuditRubricService().loadDocuments(
    adapter.listRubrics(PROJECT_ROOT, project.RUBRICS), adapter.listPackageNames(PROJECT_ROOT),
  );

  return createRubricCases({
    layer, dir, model: config.model,
    cases: exampleFile.parseExampleFile(path.join(dir, layer + ".examples.md")).rubric,
    questions: new Map(rows.filter((row) => row.verdict === "accepted").map((row) => [row.id, row.question])),
    ask: client && (async (state, question) => {
      const answers = await client.ask(state, [{ name: "violation", instructions: question, excerpt: state }]);

      return answers.get("violation") ?? NaN;
    }),
  });
}

const EVIDENCE = "evidence.md";

const certificateFiles = (root: string) => new QualityCertificateFileAdapter(root, change.CHANGES, async (name) => {
  const product = await products.productOf(root, change.readChange(root, name)?.product);

  return product.name ? [product.root] : products.productRoots(product.config);
});

export function digestOf(root: string, name: string): Promise<string> {
  return certificateFiles(root).digestOf(name);
}

export function readEvidence(root: string, name: string) {
  return certificateFiles(root).readEvidence(name);
}

export function writeEvidence(root: string, record: InspectionCertificateRecord): void {
  certificateFiles(root).writeEvidence(record);
}

const inspectionOf = async (root: string, name: string) => {
  const order = change.readChange(root, name);
  if (!order) throw new QualityException(`no active change is called ${name}`);

  if (!order.schema || !schema.schemaNames().includes(order.schema))
    throw new QualityException(
      `the change ${name} was made with the schema ${order.schema ?? "(none)"}, which this package does not define; schemas: ${schema.schemaNames().join(", ")}`,
    );

  const product = await products.productOf(root, order.product);
  const layout = await generated.layoutOf(root, order.product);
  const process = await schema.loadSchema(order.schema);
  const lineProcess = await schema.loadSchema(product.schema);
  const keyVariable = product.config.review.keyVariable;
  const key = loadEnv(root, runtime.environment())[keyVariable];

  const zones = Object.entries(process.workstreams).flatMap(([id, workstream]) =>
    workstream.layers(product.config).flatMap((layer) =>
      (layer.fallow?.zones ?? []).map(({ patterns }) => ({ id, patterns })),
    ),
  );

  const adapter = new FinalInspectionAdapter(root, {
    line: product.name,
    auditEnvironment: { ...runtime.environment(), [keyVariable]: key },
    findWorkstream: (file) => {
      const relative = product.name && file.startsWith(`${product.root}/`)
        ? file.slice(product.root.length + 1)
        : file;

      return zones.find(({ patterns }) => patterns.some((pattern) => path.matchesGlob(relative, pattern)))?.id;
    },
    feedback: (name, finding) => feedback.raise(root, name, finding),
    snapshot: {
      name,
      repository: layout.repository,
      drawings: order.deltaSpecs.map((file) => {
        const spec = file.replace(/^specs\//, "").replace(/\/spec\.md$/, "");
        const source = path.join(order.dir, file);
        const text = fileSystem.readFileSync(source, "utf8");
        const gauge = generated.testOf(spec, layout);
        const suite = path.join("test", "schemas", spec + ".test.ts");

        if (!gauge && layout.repository && fileSystem.existsSync(path.join(root, suite)))
          return { spec, text, gauge: suite, expected: scenariosOfDelta(source) };

        return { spec, text, gauge };
      }),
      workstreams: !plan.parsePlan(order.plan ?? "").phases.some((phase) => phase.tasks.length) ? [] : Object.entries(process.workstreams).map(([id, workstream]) => ({
        id,
        upstream: product.config.workstreams[id]?.dependsOn ?? [],
        tests: workstream.tests ?? [],
      })),
      procedures: plan.parsePlan(order.plan ?? "").procedures.map((block) => ({
        slug: block.slug,
        environments: (plan.tagOf(block, "env")?.value ?? "").split(",").filter(Boolean),
        declined: plan.tagOf(block, "probed")?.value === "declined",
      })),
      platform: product.config.platform.name,
      review: { hasRubric: lineProcess.rubrics.length > 0, keyVariable, configured: Boolean(key) },
    },
  }, certificateFiles(root));

  return new InspectWorkOrderUseCase(new FinalInspectionRepositoryImplementation(adapter));
};

const stageRepository = (root: string) => new StageHoldRepositoryImplementation(
  new StageHoldAdapter(root, change.CHANGES, change.GATE, {
    active: async () => (await validate.changesInImplementation(root)).map((building) => ({
      name: building.name,
      process: building.schema,
      line: building.product,
      phases: building.plan.phases,
      pendingFeedback: feedback.raised(root, building.name).length > 0,
    })),
    async hasCurrentVerification(name) {
      const evidence = readEvidence(root, name);

      return evidence?.verdict === "verified" && evidence.digest === await digestOf(root, name);
    },
    workstreams: async (building) => {
      const [line, process] = await Promise.all([
        products.productOf(root, building.line),
        schema.loadSchema(building.process),
      ]);

      return Object.entries(process.workstreams).map(([id, workstream]) => ({
        id,
        upstream: line.config.workstreams[id]?.dependsOn ?? [],
        tests: workstream.tests ?? [],
      }));
    },
    installed: () => doctor.readInstalled(root)?.installed,
    linked: (process) => doctor.schemaLinkHolds(root, process),
    hooks: (agent) => doctor.unwiredGuards(root, agent),
    places: doctor.PLACES,
  }),
);

const controller = new QualityController({
  initialize: () => project.initialize(),
  line: () => project.product.name,
  gauges: newGauges,
  gaugeRun,
  inspection,
  recordedLedger,
  installedLedger,
  recordRules: (ledger) => fileSystem.writeFileSync(rulesRecord(), `${JSON.stringify({ rules: ledger }, null, 2)}\n`),
  deterministicIds: () => rules.deterministicIds(project.architecture),
  brokenBy: (wanted) => toStandardError(async () => {
    const broken = new Map<string, string[]>();

    await check.check([], ({ standard, file }) => {
      if (wanted.has(standard)) broken.set(standard, [...new Set([...broken.get(standard) ?? [], file || "the whole product"])]);
    });

    return broken;
  }),
  audit: auditOf,
  activeChanges: () => change.activeChanges(PROJECT_ROOT),
  inspectionOf: (name) => inspectionOf(PROJECT_ROOT, name),
  evidenceFile: EVIDENCE,
  hold: () => {
    const cwd = hookInput().cwd ?? runtime.workingDirectory();

    return new HoldStageUseCase(stageRepository(projectOf(runtime.environment().CLAUDE_PROJECT_DIR || cwd)));
  },
}, consoleIo);

export const makeGauges = controller.generate.bind(controller);
export const runGauges = controller.test.bind(controller);
export const runQualityControl = controller.check.bind(controller);
export const ruleConformance = controller.rules.bind(controller);
export const audit = controller.review.bind(controller);
export const inspectWorkOrder = controller.verify.bind(controller);
export const holdStage = controller.gate.bind(controller);

export { exampleFile, examples, expectFile, rules, test };

export const sdkArchitecture: typeof project.architecture =
  project.architecture;

export const sdkExampleArchitecture: typeof project.exampleArchitecture =
  project.exampleArchitecture;

export const sdkExamples: typeof examples.examples = examples.examples;

export const sdkExpectations: typeof expectations.expectations =
  expectations.expectations;

export const sdkRuleIds: typeof rules.ruleIds = rules.ruleIds;
