import type { CloseWorkOrderUseCase } from "../../application/use-cases/close-work-order.use-case.ts";
import type { DispatchWorkOrderUseCase } from "../../application/use-cases/dispatch-work-order.use-case.ts";
import type { ListReleasedWorkOrdersUseCase } from "../../application/use-cases/list-released-work-orders.use-case.ts";
import type { MakeReadingCopiesUseCase } from "../../application/use-cases/make-reading-copies.use-case.ts";
import type { PullAndonUseCase } from "../../application/use-cases/pull-andon.use-case.ts";
import type { StartStageUseCase } from "../../application/use-cases/start-stage.use-case.ts";
import type { ValidateWorkOrderUseCase } from "../../application/use-cases/validate-work-order.use-case.ts";
import { PlanTextEntity } from "../../domain/entities/plan-text.entity.ts";
import type { Io } from "../../../shared/domain/schemas/io.schema.ts";

type Raised = { source: string; names: string; findings: string[] };

export type ProductionPorts = {
  dispatch: DispatchWorkOrderUseCase;
  reading: MakeReadingCopiesUseCase;
  andon: PullAndonUseCase;
  closing: CloseWorkOrderUseCase;
  start: StartStageUseCase;
  assessment: ValidateWorkOrderUseCase;
  released: ListReleasedWorkOrdersUseCase;
  sources: readonly string[];
  activeChanges(): string[];
  productOf(name: string): string | undefined;
  schemaOf(name: string): string | undefined;
  localPath(path: string): string;
  raised(name: string): Raised[];
  raise(name: string, finding: Raised): void;
  checkAfterArchive(): { status: number; output: string };
};

export class ProductionController {
  private readonly ports: ProductionPorts;
  private readonly io: Io;

  constructor(ports: ProductionPorts, io: Io) {
    this.ports = ports;
    this.io = io;
  }

  releasedWorkOrders() {
    return this.ports.released.execute();
  }

  async handoff(args: string[]): Promise<number> {
    const [name, option, sessionRoot] = args;

    if (!name || (option !== undefined && (option !== "--session-root" || !sessionRoot || args.length !== 3))) {
      this.io.warn("Usage: factory handoff <change> [--session-root <path>]");

      return 2;
    }

    const { status, said } = await this.ports.dispatch.execute(name, sessionRoot);
    this.say(status, said);

    return status;
  }

  async reading(args: string[]): Promise<number> {
    const local = args.map((arg) => (arg.startsWith("--") ? arg : this.ports.localPath(arg)));
    const { status, lines } = await this.ports.reading.execute(local);
    this.say(status, lines);

    return status;
  }

  async feedback(args: string[]): Promise<number> {
    const [name, action] = args;
    const known = this.ports.activeChanges();

    if (!name || !known.includes(name)) {
      this.io.warn(`Name the change the feedback is about. Changes: ${known.join(", ") || "none"}`);

      return 2;
    }

    if (!action) return this.listFeedback(name);

    const options = (flag: string) => args.flatMap((arg, index) =>
      arg === flag && args[index + 1] !== undefined ? [args[index + 1]!] : []);

    if (action === "reviewer-repair") return this.reviewerRepair(options("--scope")[0], options("--rule")[0]);

    const [source] = options("--from");
    const [says] = options("--says");

    if ((action !== "raise" && action !== "take") || !source || !says || !this.ports.sources.includes(source)) {
      this.io.warn(`Say what to do with the feedback: raise or take, with --from (one of: ${this.ports.sources.join(", ")}) and --says.`);

      return 2;
    }

    if (action === "raise") {
      this.ports.raise(name, { source, names: options("--names")[0] ?? name, findings: [says] });
      this.io.write(`raised: ${source} about ${name}`);

      return 0;
    }

    const [phase] = options("--phase");
    await this.ports.andon.execute(name, { source, says, phase: phase === undefined ? undefined : Number(phase), questions: options("--ask") });
    this.io.write(`taken in: ${source} about ${name}`);

    return 0;
  }

  async archive(args: string[]): Promise<number> {
    const name = args.find((arg) => !arg.startsWith("--"));
    const report = await this.ports.closing.execute(name);

    for (const outcome of report)
      this.io.write(outcome.place === "archived" ? `archived: ${outcome.change} as ${outcome.as}` : `still active: ${outcome.change} — ${outcome.reason}`);

    if (!report.length) this.io.write("no active change");

    if (report.some(({ place }) => place === "archived")) {
      const checked = this.ports.checkAfterArchive();
      this.io.write(checked.status === 0 ? "every check passes" : `the checks fail:\n${checked.output}`);
      if (checked.status !== 0) return 1;
    }

    return name && report.some(({ place }) => place !== "archived") ? 1 : 0;
  }

  async implement(args: string[]): Promise<number> {
    const [name] = args;
    const known = this.ports.activeChanges();

    if (!name || !known.includes(name)) {
      this.io.warn(`Name the change to implement. Changes: ${known.join(", ") || "none"}`);

      return 2;
    }

    const result = await this.ports.start.execute(name);

    if (result.state === "started") {
      const line = this.ports.productOf(name);
      this.io.write(`in implementation: ${name}${line ? ` (product ${line})` : ""} — ${result.phase}`);
      for (const task of result.tasks) this.io.write(`- [ ] ${task}`);

      return 0;
    }

    if (result.state === "cannot validate") {
      this.io.warn(result.message);

      return 2;
    }

    if (result.state === "nothing to build") {
      this.io.write(`every task of ${name} is done: the verify phase is next`);

      return 0;
    }

    this.io.write(`${result.state}: ${name}`);
    for (const finding of result.findings) this.io.write(`- ${finding}`);

    return 1;
  }

  async validate(args: string[]): Promise<number> {
    const [name] = args;

    if (!name) {
      this.io.warn(`Name the change to validate. Changes: ${this.ports.activeChanges().join(", ") || "none"}`);

      return 2;
    }

    const verdict = await this.ports.assessment.execute(name);
    const invalid = verdict.findings.find(({ rule }) => rule === "not-validatable");

    if (invalid) {
      this.io.warn(invalid.message);

      return 2;
    }

    this.io.write(`${verdict.ready ? "ready" : "not ready"}: ${name} (${this.ports.schemaOf(name)})`);
    for (const { rule, message } of verdict.findings) this.io.write(`- [${rule}] ${message}`);

    return verdict.ready ? 0 : 1;
  }

  private listFeedback(name: string): number {
    const pending = this.ports.raised(name);

    for (const { source, names, findings } of pending)
      this.io.write(`${source} about ${names}:\n${findings.map((finding) => `  ${finding.split("\n").join("\n  ")}`).join("\n")}`);

    if (!pending.length) this.io.write("no feedback is waiting to be taken in");

    return 0;
  }

  private reviewerRepair(scope?: string, rule?: string): number {
    if (!scope || !["approved", "unapproved"].includes(scope) || !rule || !["determinate", "ambiguous"].includes(rule)) {
      this.io.warn("Usage: factory feedback <change> reviewer-repair --scope <approved|unapproved> --rule <determinate|ambiguous>");

      return 2;
    }

    this.io.write(PlanTextEntity.repairAction(scope === "approved", rule === "determinate"));

    return 0;
  }

  private say(status: number, lines: string[]): void {
    if (status === 0) this.io.write(lines.join("\n"));
    else this.io.warn(lines.join("\n"));
  }
}
