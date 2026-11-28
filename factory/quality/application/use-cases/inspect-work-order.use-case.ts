import { QualityCertificateAggregate } from "../../domain/aggregates/quality-certificate.aggregate.ts";
import { FinalInspectionEntity } from "../../domain/entities/final-inspection.entity.ts";
import type { CheckFailure, QualityCertificateProps } from "../../domain/schemas/quality-certificate.schema.ts";
import type { ResourceRun } from "../../domain/schemas/inspect-work-order.schema.ts";
import type { FinalInspectionRepositoryInterface } from "../repository-interfaces/final-inspection.repository-interface.ts";

export type InspectionOptions = {
  proved?: string[];
  procedures?: Record<string, "passed" | "failed">;
};

export class InspectWorkOrderUseCase {
  private readonly records: FinalInspectionRepositoryInterface;

  constructor(records: FinalInspectionRepositoryInterface) {
    this.records = records;
  }

  async execute(name: string, options: InspectionOptions = {}): Promise<QualityCertificateAggregate> {
    const inspection = new FinalInspectionEntity(await this.records.loadInspection(name));
    const gauges = inspection.gauges().map(({ file }) => file);
    const ran = gauges.length ? await this.records.runGauges(gauges) : [];
    const failing = await this.inspectWorkstreams(inspection);
    if (inspection.builds && !failing.length) failing.push(...await this.inspectWholeWorkOrder(inspection));

    const e2e = inspection.runsEndToEnd ? await this.records.runEndToEnd() : [];
    failing.push(...inspection.endToEndFailures(e2e));

    const certificate = new QualityCertificateAggregate({
      workOrder: name,
      digest: await this.records.readDigest(name),
      scenarios: inspection.scenarioResults(ran, options.proved),
      failing,
      review: await this.audit(inspection),
      procedures: inspection.procedureEvidence(options.procedures),
      e2e,
    });

    await this.records.saveCertificate(certificate);
    for (const finding of certificate.andonFindings(inspection.prover)) await this.records.pullAndon(name, finding);

    return certificate;
  }

  private async inspectWorkstreams(inspection: FinalInspectionEntity): Promise<CheckFailure[]> {
    const failing: CheckFailure[] = [];
    const failed = new Set<string>();
    const done = new Set<string>();

    for (let next = inspection.nextWorkstream(done); next; next = inspection.nextWorkstream(done)) {
      done.add(next.id);

      if (inspection.blocked(next, failed)) {
        failed.add(next.id);

        continue;
      }

      const check = await this.records.runCheck(next.id);
      const tests: ResourceRun[] = [];
      for (const kind of inspection.testKinds(next)) tests.push(await this.records.runTests(kind));
      const broken = inspection.brokenRun(check, tests);
      if (!broken) continue;

      failed.add(next.id);
      failing.push({ workstream: next.id, output: broken.output });
    }

    return [...failing, ...inspection.freshnessFailures(await this.records.checkFreshness(), failing)];
  }

  private async inspectWholeWorkOrder(inspection: FinalInspectionEntity): Promise<CheckFailure[]> {
    const check = await this.records.runWholeCheck();
    if (check.status === 0) return [];

    const owners = await Promise.all(FinalInspectionEntity.filesNamedIn(check.output).map((file) => this.records.findWorkstream(file)));

    return inspection.wholeFailures([...new Set(owners.filter((id): id is string => id !== undefined))], check.output);
  }

  private async audit(inspection: FinalInspectionEntity): Promise<QualityCertificateProps["review"]> {
    const skipped = inspection.skippedReview();
    if (skipped) return skipped;

    try {
      return { state: "run", warnings: await this.records.runAudit() };
    } catch (failure) {
      return FinalInspectionEntity.incompleteReview(failure);
    }
  }
}
