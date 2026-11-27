import type { FinalInspectionRepositoryInterface } from "../../application/repository-interfaces/final-inspection.repository-interface.ts";
import type { QualityCertificateAggregate } from "../../domain/aggregates/quality-certificate.aggregate.ts";
import { QualityException } from "../../domain/exceptions/quality.exceptions.ts";
import type { Finding, GaugeReport } from "../../domain/schemas/inspect-work-order.schema.ts";
import { FinalInspectionRecordSchema, type FinalInspectionAcl } from "../acl/final-inspection.acl.ts";

export class FinalInspectionRepositoryImplementation implements FinalInspectionRepositoryInterface {
  private readonly records: FinalInspectionAcl;

  constructor(records: FinalInspectionAcl) {
    this.records = records;
  }

  async loadInspection(name: string) {
    try {
      return FinalInspectionRecordSchema.parse(await this.records.load(name));
    } catch (cause) {
      if (cause instanceof QualityException) throw cause;
      throw new QualityException(`Unable to load work order ${name}`, { cause });
    }
  }

  async runGauges(files: string[]): Promise<GaugeReport> {
    return (await this.records.gauges(files)).map(({ name, assertionResults, status }) => {
      const assertions = assertionResults.map(({ ancestorTitles, title, status }) => ({
        requirement: (ancestorTitles.at(-1) ?? "").replace(/^Rule: /, ""),
        scenario: title,
        passed: status === "passed",
      }));
      if (status === "failed" && assertions.every(test => test.passed))
        assertions.push({ requirement: "", scenario: "Vitest suite execution", passed: false });
      return { name, assertions };
    });
  }

  runCheck(workstream: string) {
    return this.records.run(["check", "--workstream", workstream]);
  }

  runTests(kind: "unit" | "integration") {
    return this.records.run(["test", kind]);
  }

  checkFreshness() {
    return this.records.run(["generate", "--check"]);
  }

  runWholeCheck() {
    return this.records.run(["check", "--whole"]);
  }

  runEndToEnd() {
    return this.records.endToEnd();
  }

  findWorkstream(file: string) {
    return this.records.findWorkstream(file);
  }

  runAudit() {
    return this.records.audit();
  }

  readDigest(name: string) {
    return this.records.digest(name);
  }

  saveCertificate(certificate: QualityCertificateAggregate) {
    const { change, verdict, digest, scenarios, failing, review, procedures, e2e } = certificate;
    return this.records.save({ change, verdict, digest, scenarios, failing, review, procedures, e2e });
  }

  pullAndon(name: string, finding: Finding) {
    return this.records.feedback(name, finding);
  }
}
