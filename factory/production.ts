import { ProductionController } from "./production/framework/controllers/production.controller.ts";
import { consoleIo } from "./shared/infrastructure/adapters/cli.adapter.ts";
import { isAbsolute, join, relative, resolve } from "node:path";
import { readFileSync } from "node:fs";
import { products, schema } from "./engineering.ts";
import { DispatchAdapter } from "./production/infrastructure/adapters/dispatch.adapter.ts";
import { ReadingArtifactAdapter } from "./production/infrastructure/adapters/reading-artifact.adapter.ts";
import { AndonAdapter } from "./production/infrastructure/adapters/andon.adapter.ts";
import { ClosingAdapter } from "./production/infrastructure/adapters/closing.adapter.ts";
import { DispatchRepositoryImplementation } from "./production/infrastructure/repository-implementations/dispatch.repository-implementation.ts";
import { ReadingArtifactRepositoryImplementation } from "./production/infrastructure/repository-implementations/reading-artifact.repository-implementation.ts";
import { AndonRepositoryImplementation } from "./production/infrastructure/repository-implementations/andon.repository-implementation.ts";
import { ClosingRepositoryImplementation } from "./production/infrastructure/repository-implementations/closing.repository-implementation.ts";
import { DispatchWorkOrderUseCase } from "./production/application/use-cases/dispatch-work-order.use-case.ts";
import { MakeReadingCopiesUseCase } from "./production/application/use-cases/make-reading-copies.use-case.ts";
import { PullAndonUseCase } from "./production/application/use-cases/pull-andon.use-case.ts";
import { CloseWorkOrderUseCase } from "./production/application/use-cases/close-work-order.use-case.ts";
import { DEVELOPING, PROJECT_ROOT as root, self } from "./shared/infrastructure/adapters/paths.adapter.ts";

import { WorkOrderAdapter } from "./production/infrastructure/adapters/work-order.adapter.ts";
import { StageStartAdapter } from "./production/infrastructure/adapters/stage-start.adapter.ts";
import { WorkOrderRepositoryImplementation } from "./production/infrastructure/repository-implementations/work-order.repository-implementation.ts";
import { StageStartRepositoryImplementation } from "./production/infrastructure/repository-implementations/stage-start.repository-implementation.ts";
import { StartStageUseCase } from "./production/application/use-cases/start-stage.use-case.ts";
import { ListReleasedWorkOrdersUseCase } from "./production/application/use-cases/list-released-work-orders.use-case.ts";

import { ValidateWorkOrderUseCase } from "./production/application/use-cases/validate-work-order.use-case.ts";
import { WorkOrderValidationRepositoryImplementation } from "./production/infrastructure/repository-implementations/work-order-validation.repository-implementation.ts";
import { CHANGES, GATE, WorkOrderRecordAdapter } from "./production/infrastructure/adapters/work-order-record.adapter.ts";
import { DECISIONS, PROCEDURES } from "./production/infrastructure/acl/standing-record.acl.ts";
import { StandingRecordAdapter } from "./production/infrastructure/adapters/standing-record.adapter.ts";
import { AndonSignalAdapter, SOURCES } from "./production/infrastructure/adapters/andon-signal.adapter.ts";
import { DrawingProjectionAdapter } from "./production/infrastructure/adapters/drawing-projection.adapter.ts";
import { WorkOrderAssessmentAdapter } from "./production/infrastructure/adapters/work-order-assessment.adapter.ts";
import { WorkOrderAssessmentRepositoryImplementation } from "./production/infrastructure/repository-implementations/work-order-assessment.repository-implementation.ts";
import { DrawingProjectionRepositoryImplementation } from "./production/infrastructure/repository-implementations/drawing-projection.repository-implementation.ts";
import { DEFAULTS as REVIEW_DEFAULTS } from "./shared/domain/schemas/review.schema.ts";
import { DecisionJudgeAdapter } from "./production/infrastructure/adapters/decision-judge.adapter.ts";
import { loadEnv } from "./shared/infrastructure/adapters/env.adapter.ts";
import { runtime } from "./shared/infrastructure/adapters/runtime.adapter.ts";
import { AssessWorkOrderUseCase } from "./production/application/use-cases/assess-work-order.use-case.ts";
import { ProjectDrawingsUseCase } from "./production/application/use-cases/project-drawings.use-case.ts";
import { NotValidatable } from "./production/domain/exceptions/work-order.exceptions.ts";
import * as plan from "./production/domain/schemas/plan-document.schema.ts";

const records = new WorkOrderRecordAdapter();
const standing = new StandingRecordAdapter();
const signals = new AndonSignalAdapter();
const projection = new DrawingProjectionAdapter();

const assessmentRepository = new WorkOrderAssessmentRepositoryImplementation(
  records,
  standing,
  new WorkOrderAssessmentAdapter({
    schemaNames: schema.schemaNames,
    loadSchema: schema.loadSchema,
    readProjectConfig: products.readProjectConfig,
  }),
  new DecisionJudgeAdapter({
    reviewOf: async (project, product) => {
      try {
        return (await products.productOf(project, product)).config.review;
      } catch {
        return { ...REVIEW_DEFAULTS, ...(await products.readProjectConfig(project))?.review };
      }
    },
    environment: (project) => loadEnv(project, runtime.environment()),
  }),
);

const assessWorkOrder = new AssessWorkOrderUseCase(assessmentRepository);

const projectDrawings = new ProjectDrawingsUseCase(
  new DrawingProjectionRepositoryImplementation(records, projection),
  assessWorkOrder,
);

export const change = {
  CHANGES,
  GATE,
  activeChanges: records.activeChanges.bind(records),
  readChange: records.readChange.bind(records),
  readArchivedChange: records.readArchivedChange.bind(records),
  isStarted: records.isStarted.bind(records),
};

export const consolidated = {
  DECISIONS,
  PROCEDURES,
  readConsolidated: assessmentRepository.listStanding.bind(assessmentRepository),
};

export const feedback = {
  raised: signals.raised.bind(signals),
  raise: signals.raise.bind(signals),
};

export const validate = {
  NotValidatable,
  validateChange: assessWorkOrder.execute.bind(assessWorkOrder),
  changesInImplementation: assessWorkOrder.changesInImplementation.bind(assessWorkOrder),
};

export const merged = {
  openspec: projection.openspec.bind(projection),
  mergedSpecs: projectDrawings.execute.bind(projectDrawings),
  async specsAsReadyChangesLeaveThem(project: string) {
    const projected = await merged.mergedSpecs(project);

    return projected
      ? { base: projected.root, dispose: projected.dispose }
      : { base: project, dispose: () => {} };
  },
};

export { plan };
export const sdkValidateChange = validate.validateChange;

const assess = async (name: string) => {
  try {
    return (await validate.validateChange(root, name)).findings;
  } catch (failure) {
    if (failure instanceof validate.NotValidatable)
      return [{ rule: "not-validatable", message: failure.message }];

    throw failure;
  }
};

const directory = join(root, change.CHANGES);

const dispatch = new DispatchWorkOrderUseCase(new DispatchRepositoryImplementation(new DispatchAdapter(
  root,
  async (name) => {
    const findings = await assess(name);

    return { ready: !findings.length, findings };
  },
  async () => (await products.readProjectConfig(root))?.implement?.runner ?? "session",
)));

const reading = new MakeReadingCopiesUseCase(new ReadingArtifactRepositoryImplementation(new ReadingArtifactAdapter(
  root, async () => (await products.readProjectConfig(root))?.language,
)));

const andon = new PullAndonUseCase(new AndonRepositoryImplementation(new AndonAdapter(
  directory, change.GATE, (order) => feedback.raised(root, order),
)));

const closing = new CloseWorkOrderUseCase(new ClosingRepositoryImplementation(new ClosingAdapter(
  root, directory, (name) => merged.openspec(root, ["archive", name, "-y"]), {
    async listOrders() {
      return change.activeChanges(root).map((name) => {
        const order = change.readChange(root, name);

        return { name, created: order?.created ?? "", product: order?.product };
      });
    },
    async findCertificate(name) { return (await import("./quality.ts")).readEvidence(root, name) ?? null; },
    async currentDigest(name) { return (await import("./quality.ts")).digestOf(root, name); },
    validateWorkOrder: assess,
    async listStanding() { return consolidated.readConsolidated(root); },
    async recordFinding(name, block, message) {
      feedback.raise(root, name, { source: "the archive", names: block, findings: [message] });
    },
    async makeGauges() { self(root, ["generate"]); },
  },
)));

const workOrders = new WorkOrderRepositoryImplementation(new WorkOrderAdapter(
  directory,
  async () => change.activeChanges(root),
  async (name) => {
    const item = change.readChange(root, name);
    if (!item?.plan || !item.schema) return null;

    return {
      name,
      process: item.schema,
      line: item.product,
      plan: item.plan,
      revisions: item.deltaSpecs.map((file) => ({
        drawing: file.replace(/^specs\//, "").replace(/\/spec\.md$/, ""),
        document: readFileSync(join(item.dir, file), "utf8"),
      })),
      andon: feedback.raised(root, name).map(({source, names, findings}) => ({
        from: source,
        names,
        says: findings.join("\n"),
      })),
    };
  },
));

const start = new StartStageUseCase(workOrders, new StageStartRepositoryImplementation(new StageStartAdapter(
  directory, change.GATE, assess,
  async (name) => {
    const item = change.readChange(root, name)!;

    return { code: (await schema.loadSchema(item.schema!)).definition.workstreams.length > 0, line: item.product };
  },
  (args) => self(root, args),
)));


const assessment = new ValidateWorkOrderUseCase(new WorkOrderValidationRepositoryImplementation(
  { readPlan: async (name) => change.readChange(root, name)?.plan ?? null, listFindings: assess },
));

const controller = new ProductionController({
  dispatch,
  reading,
  andon,
  closing,
  start,
  assessment,
  released: new ListReleasedWorkOrdersUseCase(workOrders),
  sources: SOURCES,
  activeChanges: () => change.activeChanges(root),
  productOf: (name) => change.readChange(root, name)?.product,
  schemaOf: (name) => change.readChange(root, name)?.schema,
  localPath: (arg) => {
    const path = relative(root, resolve(root, arg));

    return isAbsolute(path) || path.startsWith("..") ? arg : path;
  },
  raised: (name) => feedback.raised(root, name),
  raise: (name, finding) => feedback.raise(root, name, finding),
  checkAfterArchive: () => self(root, DEVELOPING ? ["generate", "--check"] : ["check"]),
}, consoleIo);

export const listReleasedWorkOrders = controller.releasedWorkOrders.bind(controller);
export const dispatchWorkOrder = controller.handoff.bind(controller);
export const makeReadingCopies = controller.reading.bind(controller);
export const pullAndon = controller.feedback.bind(controller);
export const closeWorkOrders = controller.archive.bind(controller);
export const startStage = controller.implement.bind(controller);
export const validateWorkOrder = controller.validate.bind(controller);
