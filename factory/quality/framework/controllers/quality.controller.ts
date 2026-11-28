import type { AuditInput, AuditUseCase } from "../../application/use-cases/audit.use-case.ts";
import type { HoldStageUseCase } from "../../application/use-cases/hold-stage.use-case.ts";
import type { InspectionOptions, InspectWorkOrderUseCase } from "../../application/use-cases/inspect-work-order.use-case.ts";
import type { MakeGaugesUseCase } from "../../application/use-cases/make-gauges.use-case.ts";
import type { RunGaugesUseCase } from "../../application/use-cases/run-gauges.use-case.ts";
import type { RunQualityControlUseCase } from "../../application/use-cases/run-quality-control.use-case.ts";
import { RuleChange, type RulesLedger } from "../../domain/schemas/rules-ledger.schema.ts";
import { RuleConformanceService } from "../../domain/services/rule-conformance.service.ts";
import type { Io } from "../../../shared/domain/schemas/io.schema.ts";

const SCOPES = ["--workstream", "--layer", "--module", "--whole"];

export type QualityPorts = {
  initialize(): Promise<void>;
  line(): string;
  gauges: MakeGaugesUseCase;
  gaugeRun: RunGaugesUseCase;
  inspection: RunQualityControlUseCase;
  recordedLedger(): RulesLedger | undefined;
  installedLedger(): RulesLedger;
  recordRules(ledger: RulesLedger): void;
  deterministicIds(): Set<string>;
  brokenBy(rules: Set<string>): Promise<Map<string, string[]>>;
  audit(): Promise<{ useCase: AuditUseCase; input: AuditInput }>;
  activeChanges(): string[];
  inspectionOf(name: string): Promise<InspectWorkOrderUseCase>;
  evidenceFile: string;
  hold(): HoldStageUseCase;
};

export class QualityController {
  private readonly ports: QualityPorts;
  private readonly io: Io;
  private readonly conformance = new RuleConformanceService();

  constructor(ports: QualityPorts, io: Io) {
    this.ports = ports;
    this.io = io;
  }

  async generate(args: string[]): Promise<number> {
    return (await this.ports.gauges.execute(args)).exitStatus;
  }

  test(args: string[]): Promise<number> {
    return this.ports.gaugeRun.execute(args);
  }

  async check(args: string[]): Promise<number> {
    await this.ports.initialize();
    const run = await this.ports.inspection.execute(this.ports.line(), args);
    if (run.passed() && !args.some((arg) => SCOPES.includes(arg))) this.ports.recordRules(this.ports.installedLedger());

    return run.passed() ? 0 : run.exitStatus || 1;
  }

  async rules(args: string[]): Promise<number> {
    await this.ports.initialize();
    const changes = this.conformance.compare(this.ports.recordedLedger(), this.ports.installedLedger());
    const toCheck = new Set(this.conformance.toCheck(changes, this.ports.deterministicIds()));
    const broken = toCheck.size ? await this.ports.brokenBy(toCheck) : new Map<string, string[]>();
    const changed = this.conformance.conformance(changes, broken).filter(({ change }) => change !== RuleChange.Unchanged);

    if (args.includes("--json")) this.io.write(JSON.stringify(changed));
    else if (!changed.length) this.io.write("the rules are the ones the project last passed");
    else for (const { rule, change, files } of changed) this.io.write(`${change}: ${rule}${files.length ? ` — ${files.join(", ")}` : ""}`);

    return 0;
  }

  async review(): Promise<number> {
    await this.ports.initialize();
    const { useCase, input } = await this.ports.audit();
    const report = await useCase.execute(input);

    if ("lines" in report) for (const line of report.lines) this.io.write(line);
    else this.io.warn(report.issue);

    return report.code;
  }

  async verify(args: string[]): Promise<number> {
    const [name] = args;
    const known = this.ports.activeChanges();

    if (!name || !known.includes(name)) {
      this.io.warn(`Name the change to verify. Changes: ${known.join(", ") || "none"}`);

      return 2;
    }

    const procedures: NonNullable<InspectionOptions["procedures"]> = {};
    const proved = args.flatMap((arg, i) => arg === "--proved" && args[i + 1] ? [args[i + 1]!] : []);

    for (const [i, arg] of args.entries()) {
      if (arg !== "--procedure") continue;

      const match = /^(.+)=(passed|failed)$/.exec(args[i + 1] ?? "");

      if (!match) {
        this.io.warn("Say how a procedure went as --procedure <slug>@<environment>=<passed|failed>.");

        return 2;
      }

      procedures[match[1]!] = match[2] === "passed" ? "passed" : "failed";
    }

    const certificate = await (await this.ports.inspectionOf(name)).execute(name, { procedures, proved });
    const passed = certificate.scenarios.filter(({ result }) => result === "passed").length;
    const { review, e2e } = certificate;
    this.io.write(`${certificate.verdict}: ${name}`);
    this.io.write(`- scenarios: ${passed} of ${certificate.scenarios.length} matched to a passing test`);
    for (const { spec } of certificate.scenarios.filter(({ by }) => by)) this.io.write(`  by the person's word: ${spec}`);
    for (const { result, spec, scenario } of certificate.unproved) this.io.write(`  ${result}: ${spec} · ${scenario || "no generated test ran"}`);
    this.io.write(`- checks: ${certificate.failing.length ? `failing in ${certificate.failing.map(({ workstream }) => workstream).join(", ")}` : "every check passes"}`);
    this.io.write(`- review: ${review.state === "run" ? `run, ${review.warnings.length} warning(s)` : `${review.state} (${review.note})`}`);
    if (e2e?.length) this.io.write(`- end-to-end: ${e2e.filter(({ result }) => result === "passed").length} of ${e2e.length} passing`);
    for (const { slug, env, treatment, outcome } of certificate.procedures) this.io.write(`- procedure ${slug} in ${env}: ${treatment}${outcome ? `, ${outcome}` : ""}`);
    this.io.write(`- evidence: openspec/changes/${name}/${this.ports.evidenceFile}`);

    return certificate.verdict === "verified" ? 0 : 1;
  }

  async gate(args: string[]): Promise<number> {
    const hold = await this.ports.hold().execute(args.includes("--helper"));
    for (const reason of hold.reasons) this.io.warn(reason);

    return hold.held ? 2 : 0;
  }
}
