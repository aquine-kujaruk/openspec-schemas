import { PlanTextEntity } from "./production/domain/entities/plan-text.entity.ts";
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
import { WorkOrderValidationAdapter } from "./production/infrastructure/adapters/work-order-validation.adapter.ts";
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
    const projected = await projectDrawings.execute(project);

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

export async function dispatchWorkOrder(args: string[]): Promise<number> {
  const [name, option, sessionRoot] = args;

  if (!name || (option !== undefined && (option !== "--session-root" || !sessionRoot || args.length !== 3))) {
    console.error("Usage: factory handoff <change> [--session-root <path>]");

    return 2;
  }

  const { status, said } = await dispatch.execute(name, sessionRoot);
  (status === 0 ? console.log : console.error)(said.join("\n"));

  return status;
}

export async function makeReadingCopies(args: string[]): Promise<number> {
  const local = args.map((arg) => {
    if (arg.startsWith("--")) return arg;
    const path = relative(root, resolve(root, arg));

    return isAbsolute(path) || path.startsWith("..") ? arg : path;
  });

  const { status, lines } = await reading.execute(local);
  (status === 0 ? console.log : console.error)(lines.join("\n"));

  return status;
}

export async function pullAndon(args: string[]): Promise<number> {
  const [name, action] = args;
  const known = change.activeChanges(root);

  if (!name || !known.includes(name)) {
    console.error(`Name the change the feedback is about. Changes: ${known.join(", ") || "none"}`);

    return 2;
  }

  if (!action) {
    const pending = feedback.raised(root, name);

    for (const { source, names, findings } of pending) {
      const message = findings.map((finding) => `  ${finding.split("\n").join("\n  ")}`).join("\n");
      console.log(`${source} about ${names}:\n${message}`);
    }

    if (!pending.length) console.log("no feedback is waiting to be taken in");

    return 0;
  }

  const options = (flag: string) => args.flatMap((arg, index) =>
    arg === flag && args[index + 1] !== undefined ? [args[index + 1]!] : []);

  if (action === "reviewer-repair") {
    const [scope] = options("--scope");
    const [rule] = options("--rule");

    if (!scope || !["approved", "unapproved"].includes(scope) ||
        !rule || !["determinate", "ambiguous"].includes(rule)) {
      console.error("Usage: factory feedback <change> reviewer-repair --scope <approved|unapproved> --rule <determinate|ambiguous>");

      return 2;
    }

    console.log(PlanTextEntity.repairAction(scope === "approved", rule === "determinate"));

    return 0;
  }

  const [source] = options("--from");
  const [says] = options("--says");

  if ((action !== "raise" && action !== "take") || !source || !says ||
      !SOURCES.some((entry) => entry === source)) {
    console.error(
      `Say what to do with the feedback: raise or take, with --from (one of: ${SOURCES.join(", ")}) and --says.`,
    );

    return 2;
  }

  if (action === "raise") {
    feedback.raise(root, name, { source, names: options("--names")[0] ?? name, findings: [says] });
    console.log(`raised: ${source} about ${name}`);

    return 0;
  }

  const [phase] = options("--phase");
  await andon.execute(name, { source, says, phase: phase === undefined ? undefined : Number(phase), questions: options("--ask") });
  console.log(`taken in: ${source} about ${name}`);

  return 0;
}

export async function closeWorkOrders(args: string[]): Promise<number> {
  const name = args.find((arg) => !arg.startsWith("--"));
  const report = await closing.execute(name);

  for (const outcome of report) console.log(outcome.place === "archived"
    ? `archived: ${outcome.change} as ${outcome.as}`
    : `still active: ${outcome.change} — ${outcome.reason}`);

  if (!report.length) console.log("no active change");

  if (report.some(({place}) => place === "archived")) {
    const checked = self(root, DEVELOPING ? ["generate", "--check"] : ["check"]);
    console.log(checked.status === 0 ? "every check passes" : `the checks fail:\n${checked.output}`);
    if (checked.status !== 0) return 1;
  }

  return name && report.some(({place}) => place !== "archived") ? 1 : 0;
}

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

const released = new ListReleasedWorkOrdersUseCase(workOrders);
export const listReleasedWorkOrders = () => released.execute();

export async function startStage(args: string[]): Promise<number> {
  const [name] = args;
  const known = change.activeChanges(root);

  if (!name || !known.includes(name)) {
    console.error(`Name the change to implement. Changes: ${known.join(", ") || "none"}`);

    return 2;
  }

  const result = await start.execute(name);

  if (result.state === "started") {
    const line = change.readChange(root, name)?.product;
    console.log(`in implementation: ${name}${line ? ` (product ${line})` : ""} — ${result.phase}`);
    for (const task of result.tasks) console.log(`- [ ] ${task}`);

    return 0;
  }

  if (result.state === "cannot validate") {
    console.error(result.message);

    return 2;
  }

  if (result.state === "nothing to build") {
    console.log(`every task of ${name} is done: the verify phase is next`);

    return 0;
  }

  console.log(`${result.state}: ${name}`);
  for (const finding of result.findings) console.log(`- ${finding}`);

  return 1;
}

const assessment = new ValidateWorkOrderUseCase(new WorkOrderValidationRepositoryImplementation(
  new WorkOrderValidationAdapter(async (name) => change.readChange(root, name)?.plan ?? null, assess),
));

export async function validateWorkOrder(args: string[]): Promise<number> {
  const [name] = args;

  if (!name) {
    console.error(`Name the change to validate. Changes: ${change.activeChanges(root).join(", ") || "none"}`);

    return 2;
  }

  const verdict = await assessment.execute(name);
  const invalid = verdict.findings.find(({rule}) => rule === "not-validatable");

  if (invalid) {
    console.error(invalid.message);

    return 2;
  }

  console.log(`${verdict.ready ? "ready" : "not ready"}: ${name} (${change.readChange(root, name)?.schema})`);
  for (const { rule, message } of verdict.findings) console.log(`- [${rule}] ${message}`);

  return verdict.ready ? 0 : 1;
}
