import { z } from "zod";
import { ScenarioResult } from "../value-objects/scenario-result.value-object.ts";

export const InspectionVerdictSchema = z.enum(["verified", "not verified"]);
export const E2eResultSchema = z.object({
  test: z.string(),
  result: z.enum(["passed", "failed"]),
  output: z.string().optional(),
});
const AuditRecordSchema = z.object({
  state: z.enum(["run", "skipped"]),
  warnings: z.array(z.string()),
  note: z.string().optional(),
});
export const ProcedureEvidenceSchema = z.object({
  slug: z.string(),
  env: z.string(),
  treatment: z.enum(["executed", "reviewed only", "not executed", "declined"]),
  outcome: z.enum(["passed", "failed"]).optional(),
});
const CheckFailureSchema = z.object({ workstream: z.string(), output: z.string() });
export const QualityCertificateSchema = z.object({
  workOrder: z.string().min(1),
  digest: z.string(),
  scenarios: z.array(z.instanceof(ScenarioResult)),
  failing: z.array(CheckFailureSchema),
  review: AuditRecordSchema,
  procedures: z.array(ProcedureEvidenceSchema),
  e2e: z.array(E2eResultSchema).optional(),
});

export type QualityCertificateProps = z.input<typeof QualityCertificateSchema>;
export type InspectionVerdict = z.infer<typeof InspectionVerdictSchema>;
export type E2eResult = z.infer<typeof E2eResultSchema>;
export type ProcedureEvidence = z.infer<typeof ProcedureEvidenceSchema>;
export type CheckFailure = z.infer<typeof CheckFailureSchema>;
