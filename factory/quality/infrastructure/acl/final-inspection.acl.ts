import { z } from "zod";

export const FinalInspectionRecordSchema = z.object({
  name: z.string(),
  repository: z.boolean(),
  drawings: z.array(z.object({ spec: z.string(), text: z.string(), gauge: z.string().optional(), expected: z.array(z.object({ requirement: z.string(), scenario: z.string() })).optional() })),
  workstreams: z.array(z.object({
    id: z.string(),
    upstream: z.array(z.string()),
    tests: z.array(z.enum(["unit", "integration", "acceptance"])),
  })),
  procedures: z.array(z.object({ slug: z.string(), environments: z.array(z.string()), declined: z.boolean() })),
  platform: z.string(),
  review: z.object({ hasRubric: z.boolean(), keyVariable: z.string(), configured: z.boolean() }),
});

export type FinalInspectionRecord = z.infer<typeof FinalInspectionRecordSchema>;
export type InspectionRun = { status: number | null; output: string };

const FileGaugeRecordSchema = z.object({
  name: z.string(),
  status: z.string().optional(),
  assertionResults: z.array(z.object({ ancestorTitles: z.array(z.string()), title: z.string(), status: z.string() })),
});
export const FileGaugeReportSchema = z.object({ testResults: z.array(FileGaugeRecordSchema) });
export type FileGaugeRecord = z.infer<typeof FileGaugeRecordSchema>;
export type EndToEndRecord = { test: string; result: "passed" | "failed"; output?: string };
export type InspectionFinding = { source: string; names: string; findings: string[] };
export interface FinalInspectionAcl {
  load(name: string): Promise<FinalInspectionRecord>;
  gauges(files: string[]): Promise<FileGaugeRecord[]>;
  run(args: string[]): Promise<InspectionRun>;
  endToEnd(): Promise<EndToEndRecord[]>;
  findWorkstream(file: string): Promise<string | undefined>;
  audit(): Promise<string[]>;
  digest(name: string): Promise<string>;
  save(record: InspectionCertificateRecord): Promise<void>;
  feedback(name: string, finding: InspectionFinding): Promise<void>;
}

export const InspectionAuditState = { Run: "run", Skipped: "skipped", Incomplete: "incomplete" } as const;

export type InspectionCertificateRecord = {
  change: string;
  verdict: "verified" | "not verified";
  digest: string;
  scenarios: { spec: string; requirement: string; scenario: string; result: string; by?: string }[];
  failing: { workstream: string; output: string }[];
  review: { state: (typeof InspectionAuditState)[keyof typeof InspectionAuditState]; warnings: string[]; note?: string };
  procedures: { slug: string; env: string; treatment: string; outcome?: string }[];
  e2e?: EndToEndRecord[];
};
