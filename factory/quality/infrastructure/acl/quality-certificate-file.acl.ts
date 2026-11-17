import type { InspectionCertificateRecord } from "./final-inspection.acl.ts";

export interface QualityCertificateFileAcl {
  digestOf(name: string): Promise<string>;
  readEvidence(name: string): Pick<InspectionCertificateRecord, "verdict" | "digest"> | undefined;
  writeEvidence(record: InspectionCertificateRecord): void;
}
