import { validateSchema } from "../../../shared/domain/schemas/validation.schema.ts";

import {
  FinalInspectionSchema,
  type FinalInspection,
  type GaugeReport,
  type ResourceRun,
  type Workstream,
} from "../schemas/inspect-work-order.schema.ts";

import type { CheckFailure, ProcedureEvidence, QualityCertificateProps } from "../schemas/quality-certificate.schema.ts";
import { GaugeValueObject } from "../value-objects/gauge.value-object.ts";
import { ScenarioResultValueObject } from "../value-objects/scenario-result.value-object.ts";

type EndToEndRun = NonNullable<QualityCertificateProps["e2e"]>[number];

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

export class FinalInspectionEntity {
  readonly name!: string;
  readonly repository!: boolean;
  readonly drawings!: FinalInspection["drawings"];
  readonly workstreams!: Workstream[];
  readonly procedures!: FinalInspection["procedures"];
  readonly platform!: string;
  readonly review!: FinalInspection["review"];

  constructor(props: FinalInspection) {
    validateSchema(this, FinalInspectionSchema, props);
  }

  static filesNamedIn(output: string): string[] {
    return [...new Set(output.match(/[\w@.\/-]+\.(?:tsx?|jsx?|mts|cts)\b/g) ?? [])];
  }

  static incompleteReview(failure: unknown): QualityCertificateProps["review"] {
    return {
      state: "incomplete", warnings: [],
      note: `the review could not run: ${failure instanceof Error ? failure.message : String(failure)}`,
    };
  }

  get builds(): boolean {
    return this.workstreams.length > 0;
  }

  get runsEndToEnd(): boolean {
    return this.builds && this.platform === "web";
  }

  get prover(): string {
    return this.workstreams.find(({ tests }) => tests.includes("acceptance"))?.id ?? this.name;
  }

  gauges(): GaugeValueObject[] {
    return this.inspected().flatMap(({ gauge }) => gauge ? [gauge] : []);
  }

  scenarioResults(ran: GaugeReport, proved: string[] = []): ScenarioResultValueObject[] {
    return this.inspected().flatMap(({ spec, gauge, expected }) => {
      const file = gauge?.file.replaceAll("\\", "/");
      const tests = file ? ran.find(({ name }) => ("/" + name.replaceAll("\\", "/")).endsWith("/" + file))?.assertions : undefined;

      const result = (requirement: string, scenario: string, outcome: "passed" | "failed" | "missing") =>
        new ScenarioResultValueObject({ spec, requirement, scenario, result: outcome });

      if (expected?.length) {
        const remaining = [...(tests ?? [])];

        const matches = expected.map(({ requirement, scenario }) => {
          const index = remaining.findIndex((test) => test.requirement === requirement && test.scenario === scenario);
          const run = index < 0 ? undefined : remaining.splice(index, 1)[0];

          return result(requirement, scenario, run ? (run.passed ? "passed" : "failed") : "missing");
        });

        return matches.concat(remaining.filter((test) => !test.passed).map(({ requirement, scenario }) => result(requirement, scenario, "failed")));
      }

      if (!tests?.length || expected) {
        const byPerson = this.repository && !gauge && proved.includes(spec);

        return [new ScenarioResultValueObject({
          spec, requirement: "", scenario: "",
          result: byPerson ? "passed" : "missing",
          ...(byPerson ? { by: "the person" as const } : {}),
        })];
      }

      return tests.map(({ requirement, scenario, passed }) => result(requirement, scenario, passed ? "passed" : "failed"));
    });
  }

  nextWorkstream(done: Set<string>): Workstream | undefined {
    return this.workstreams.find(({ id, upstream }) => !done.has(id) && upstream.every((dependency) => done.has(dependency)));
  }

  blocked(workstream: Workstream, failed: Set<string>): boolean {
    return workstream.upstream.some((dependency) => failed.has(dependency));
  }

  testKinds(workstream: Workstream): Array<Exclude<Workstream["tests"][number], "acceptance">> {
    return workstream.tests.filter((kind) => kind !== "acceptance");
  }

  brokenRun(check: ResourceRun, tests: ResourceRun[]): ResourceRun | undefined {
    return check.status !== 0 ? check : tests.find(({ status }) => status !== 0);
  }

  freshnessFailures(fresh: ResourceRun, failing: CheckFailure[]): CheckFailure[] {
    if (fresh.status === 0 || failing.length) return [];

    return [{
      workstream: this.workstreams[0]?.id ?? "generated tests",
      output: `the generated tests are not fresh:\n${fresh.output}`,
    }];
  }

  wholeFailures(owners: string[], output: string): CheckFailure[] {
    return (owners.length ? owners : [this.name]).map((workstream) => ({ workstream, output }));
  }

  endToEndFailures(e2e: EndToEndRun[]): CheckFailure[] {
    return e2e.filter(({ result }) => result === "failed")
      .map(({ test, output }) => ({ workstream: this.name, output: output ?? `the end-to-end test ${test} fails` }));
  }

  skippedReview(): QualityCertificateProps["review"] | undefined {
    const { hasRubric, keyVariable, configured } = this.review;
    if (!hasRubric) return { state: "skipped", warnings: [], note: "the schema this project is checked with has no rubric" };
    if (!configured) return { state: "skipped", warnings: [], note: `the project configures no ${keyVariable}` };

    return undefined;
  }

  procedureEvidence(outcomes: Record<string, "passed" | "failed"> = {}): ProcedureEvidence[] {
    return this.procedures.flatMap(({ slug, environments, declined }) =>
      environments.map((env): ProcedureEvidence => {
        if (env !== "local" && env !== "sandbox") return { slug, env, treatment: "reviewed only" };

        const outcome = outcomes[`${slug}@${env}`];
        if (outcome) return { slug, env, treatment: "executed", outcome };

        return { slug, env, treatment: declined ? "declined" : "not executed" };
      }),
    );
  }

  private inspected() {
    return this.drawings
      .filter(({ text }) => !removalOnly(text))
      .map(({ spec, gauge, expected }) => ({ spec, expected, gauge: gauge ? new GaugeValueObject({ drawing: spec, file: gauge }) : undefined }));
  }
}
