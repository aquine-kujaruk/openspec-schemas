import type { QualityCertificate } from "../../domain/aggregates/quality-certificate.aggregate.ts";
import type { FinalInspection, Finding, GaugeReport, ResourceRun } from "../../domain/schemas/inspect-work-order.schema.ts";
import type { E2eResult } from "../../domain/schemas/quality-certificate.schema.ts";

export interface FinalInspectionRepositoryInterface {
  loadInspection(name: string): Promise<FinalInspection>;
  runGauges(files: string[]): Promise<GaugeReport>;
  runCheck(workstream: string): Promise<ResourceRun>;
  runTests(kind: "unit" | "integration"): Promise<ResourceRun>;
  checkFreshness(): Promise<ResourceRun>;
  runWholeCheck(): Promise<ResourceRun>;
  runEndToEnd(): Promise<E2eResult[]>;
  findWorkstream(file: string): Promise<string | undefined>;
  runAudit(): Promise<string[]>;
  readDigest(name: string): Promise<string>;
  saveCertificate(certificate: QualityCertificate): Promise<void>;
  pullAndon(name: string, finding: Finding): Promise<void>;
}
