import { QualityException } from "../../../../factory/quality/domain/exceptions/quality.exceptions.ts";
import type { FinalInspectionRepositoryInterface } from "../../../../factory/quality/application/repository-interfaces/final-inspection.repository-interface.ts";
import type { QualityCertificateAggregate } from "../../../../factory/quality/domain/aggregates/quality-certificate.aggregate.ts";
import type {
  FinalInspection, Finding, GaugeReport, ResourceRun,
} from "../../../../factory/quality/domain/schemas/inspect-work-order.schema.ts";
import type { E2eResult } from "../../../../factory/quality/domain/schemas/quality-certificate.schema.ts";

type Seed = {
  inspection: FinalInspection;
  gauges: GaugeReport;
  checkFailures: Map<string, string>;
  wholeOutput: string;
  workstreamOwners: Map<string, string>;
  endToEnd: E2eResult[];
  warnings: string[];
};
const pass: ResourceRun = { status: 0, output: "" };

export class InMemoryFinalInspectionRepository implements FinalInspectionRepositoryInterface {
  private data!: Seed;
  readonly certificates = new Map<string, QualityCertificateAggregate>();
  readonly findings: Finding[] = [];
  requested: string[] = [];
  auditUnavailable = false;

  seed(data: Seed): void {
    this.data = data;
  }

  async loadInspection(name: string): Promise<FinalInspection> {
    return { ...this.data.inspection, name };
  }

  async runGauges(files: string[]): Promise<GaugeReport> {
    this.requested = files;
    return this.data.gauges.filter(({ name }) => files.includes(name));
  }

  async runCheck(workstream: string): Promise<ResourceRun> {
    const output = this.data.checkFailures.get(workstream);
    return output ? { status: 1, output } : pass;
  }

  async runTests(): Promise<ResourceRun> {
    return pass;
  }

  async checkFreshness(): Promise<ResourceRun> {
    return pass;
  }

  async runWholeCheck(): Promise<ResourceRun> {
    return this.data.wholeOutput ? { status: 1, output: this.data.wholeOutput } : pass;
  }

  async runEndToEnd(): Promise<E2eResult[]> {
    return this.data.endToEnd;
  }

  async findWorkstream(file: string): Promise<string | undefined> {
    return this.data.workstreamOwners.get(file);
  }

  async runAudit(): Promise<string[]> {
    if (this.auditUnavailable) throw new QualityException("incomplete: the model failed", { cause: this.auditUnavailable });
    return this.data.warnings;
  }

  async readDigest(name: string): Promise<string> {
    return `digest of ${name}`;
  }

  async saveCertificate(certificate: QualityCertificateAggregate): Promise<void> {
    this.certificates.set(certificate.workOrder, certificate);
  }

  async pullAndon(_name: string, finding: Finding): Promise<void> {
    this.findings.push(finding);
  }
}
