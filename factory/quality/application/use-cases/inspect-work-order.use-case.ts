import { QualityCertificateAggregate } from "../../domain/aggregates/quality-certificate.aggregate.ts";
import type { FinalInspection } from "../../domain/schemas/inspect-work-order.schema.ts";
import type { CheckFailure, ProcedureEvidence, QualityCertificateProps } from "../../domain/schemas/quality-certificate.schema.ts";
import { GaugeValueObject } from "../../domain/value-objects/gauge.value-object.ts";
import { ScenarioResultValueObject } from "../../domain/value-objects/scenario-result.value-object.ts";
import type { FinalInspectionRepositoryInterface } from "../repository-interfaces/final-inspection.repository-interface.ts";

export type InspectionOptions = {
  proved?: string[];
  procedures?: Record<string, "passed" | "failed">;
};

const removalOnly = (text: string): boolean => {
  let fence: string | undefined;
  let removes = false;

  for (const line of text.replace(/<!--[^]*?-->/g, "").split("\n")) {
    const marker = /^ {0,3}(`{3,}|~{3,})/.exec(line)?.[1];

    if (fence) {
      if (marker?.startsWith(fence) && line.trim() === marker) fence = undefined;
      continue;
    }

    if (marker) {
      fence = marker;
      continue;
    }

    const operation = /^ {0,3}##[ \t]+(ADDED|MODIFIED|REMOVED|RENAMED)[ \t]+Requirements(?:[ \t]+#+)?\s*$/i
      .exec(line)?.[1]?.toUpperCase();

    if (operation === "REMOVED") removes = true;
    else if (operation) return false;
  }

  return removes;
};

export class InspectWorkOrderUseCase {
  private readonly records: FinalInspectionRepositoryInterface;

  constructor(records: FinalInspectionRepositoryInterface) {
    this.records = records;
  }

  async execute(name: string, options: InspectionOptions = {}): Promise<QualityCertificateAggregate> {
    const workOrder = await this.records.loadInspection(name);
    const scenarios = await this.inspectScenarios(workOrder, options);
    const failing = await this.inspectWorkstreams(workOrder);
    const builds = workOrder.workstreams.length > 0;
    if (builds && !failing.length) failing.push(...await this.inspectWholeWorkOrder(name));
    const e2e = builds && workOrder.platform === "web" ? await this.records.runEndToEnd() : [];

    for (const { test, result, output } of e2e)
      if (result === "failed")
        failing.push({ workstream: name, output: output ?? `the end-to-end test ${test} fails` });

    const review = await this.audit(workOrder);

    const certificate = new QualityCertificateAggregate({
      workOrder: name,
      digest: await this.records.readDigest(name),
      scenarios,
      failing,
      review,
      procedures: this.inspectProcedures(workOrder, options),
      e2e,
    });

    await this.records.saveCertificate(certificate);
    await this.reportFindings(certificate, workOrder);

    return certificate;
  }

  private async inspectScenarios(workOrder: FinalInspection, options: InspectionOptions): Promise<ScenarioResultValueObject[]> {
    const wanted = workOrder.drawings
      .filter(({ text }) => !removalOnly(text))
      .map(({ spec, gauge, expected }) => ({ spec, expected, gauge: gauge ? new GaugeValueObject({ drawing: spec, file: gauge }) : undefined }));

    const files = wanted.flatMap(({ gauge }) => gauge ? [gauge.file] : []);
    const ran = files.length ? await this.records.runGauges(files) : [];

    return wanted.flatMap(({ spec, gauge, expected }) => {
      const file = gauge?.file.replaceAll("\\", "/");
      const tests = file ? ran.find(({ name }) => ("/" + name.replaceAll("\\", "/")).endsWith("/" + file))?.assertions : undefined;

      if (expected?.length) {
        const remaining = [...(tests ?? [])];

        const matches = expected.map(({ requirement, scenario }) => {
          const index = remaining.findIndex(test => test.requirement === requirement && test.scenario === scenario);
          const run = index < 0 ? undefined : remaining.splice(index, 1)[0];

          return new ScenarioResultValueObject({ spec, requirement, scenario, result: run ? (run.passed ? "passed" : "failed") : "missing" });
        });

        return matches.concat(remaining.filter(test => !test.passed).map(({ requirement, scenario }) =>
          new ScenarioResultValueObject({ spec, requirement, scenario, result: "failed" })));
      }

      if (!tests?.length || expected) {
        const proved = workOrder.repository && !gauge && options.proved?.includes(spec);

        return [new ScenarioResultValueObject({
          spec,
          requirement: "",
          scenario: "",
          result: proved ? "passed" : "missing",
          ...(proved ? { by: "the person" as const } : {}),
        })];
      }

      return tests.map(({ requirement, scenario, passed }) => new ScenarioResultValueObject({
        spec, requirement, scenario, result: passed ? "passed" : "failed",
      }));
    });
  }

  private async inspectWorkstreams(workOrder: FinalInspection): Promise<CheckFailure[]> {
    const { workstreams } = workOrder;
    const failing: CheckFailure[] = [];
    const failed = new Set<string>();
    const done = new Set<string>();

    while (done.size < workstreams.length) {
      const next = workstreams.find(({ id, upstream }) =>
        !done.has(id) && upstream.every((dependency) => done.has(dependency)),
      );

      if (!next) break;
      done.add(next.id);

      if (next.upstream.some((dependency) => failed.has(dependency))) {
        failed.add(next.id);
        continue;
      }

      const check = await this.records.runCheck(next.id);
      let failedTest;

      for (const kind of next.tests) {
        if (kind === "acceptance") continue;
        const tests = await this.records.runTests(kind);
        if (tests.status !== 0) failedTest ??= tests;
      }

      const broken = check.status !== 0 ? check : failedTest;

      if (broken) {
        failed.add(next.id);
        failing.push({ workstream: next.id, output: broken.output });
      }
    }

    const fresh = await this.records.checkFreshness();

    if (fresh.status !== 0 && !failing.length) {
      failing.push({
        workstream: workstreams[0]?.id ?? "generated tests",
        output: `the generated tests are not fresh:\n${fresh.output}`,
      });
    }

    return failing;
  }

  private async inspectWholeWorkOrder(order: string): Promise<CheckFailure[]> {
    const check = await this.records.runWholeCheck();
    if (check.status === 0) return [];
    const files = [...new Set(check.output.match(/[\w@.\/-]+\.(?:tsx?|jsx?|mts|cts)\b/g) ?? [])];

    const owners = [...new Set(
      (await Promise.all(files.map((file) => this.records.findWorkstream(file))))
        .filter((id): id is string => id !== undefined),
    )];

    return (owners.length ? owners : [order]).map((workstream) => ({ workstream, output: check.output }));
  }

  private async audit(workOrder: FinalInspection): Promise<QualityCertificateProps["review"]> {
    const { hasRubric, keyVariable, configured } = workOrder.review;

    if (!hasRubric)
      return { state: "skipped", warnings: [], note: "the schema this project is checked with has no rubric" };

    if (!configured)
      return { state: "skipped", warnings: [], note: `the project configures no ${keyVariable}` };

    try {
      return { state: "run", warnings: await this.records.runAudit() };
    } catch (failure) {
      return {
        state: "incomplete", warnings: [],
        note: `the review could not run: ${failure instanceof Error ? failure.message : String(failure)}`,
      };
    }
  }

  private inspectProcedures(workOrder: FinalInspection, options: InspectionOptions): ProcedureEvidence[] {
    return workOrder.procedures.flatMap(({ slug, environments, declined }) =>
      environments.map((env): ProcedureEvidence => {
        if (env !== "local" && env !== "sandbox") return { slug, env, treatment: "reviewed only" };
        const outcome = options.procedures?.[`${slug}@${env}`];
        if (outcome) return { slug, env, treatment: "executed", outcome };

        return { slug, env, treatment: declined ? "declined" : "not executed" };
      }),
    );
  }

  private async reportFindings(certificate: QualityCertificateAggregate, workOrder: FinalInspection): Promise<void> {
    const { failing, unproved, unexercised } = certificate;
    const source = "the verify phase";

    for (const { workstream, output } of failing)
      await this.records.pullAndon(workOrder.name, { source, names: workstream, findings: [output] });

    const prover = workOrder.workstreams.find(({ tests }) => tests.includes("acceptance"))?.id ?? workOrder.name;

    if (unproved.length && !failing.some(({ workstream }) => workstream === prover))
      await this.records.pullAndon(workOrder.name, {
        source,
        names: prover,
        findings: unproved.map(({ spec, scenario, result }) => `${spec}: ${scenario || "no generated test ran"} ${result}`),
      });

    for (const { slug, env, outcome } of unexercised)
      await this.records.pullAndon(workOrder.name, {
        source,
        names: slug,
        findings: [outcome === "failed"
          ? `the procedure ${slug} failed its verification step in ${env}`
          : `the procedure ${slug} was not executed in ${env}`],
      });
  }
}
