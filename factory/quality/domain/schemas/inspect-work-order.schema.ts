import { z } from "zod";

export const InspectionDrawingsSchema = z.array(
  z.object({
    spec: z.string(),
    text: z.string(),
    gauge: z.string().optional(),
    expected: z.array(z.object({ requirement: z.string(), scenario: z.string() })).optional(),
  }),
);

export type InspectionDrawings = z.infer<typeof InspectionDrawingsSchema>;

export const FindingSchema = z.object({ source: z.string(), names: z.string(), findings: z.array(z.string()) });
export type Finding = z.infer<typeof FindingSchema>;

export const ProcedureSchema = z.object({ slug: z.string(), environments: z.array(z.string()), declined: z.boolean() });
export type Procedure = z.infer<typeof ProcedureSchema>;

export const WorkstreamSchema = z.object({
  id: z.string(),
  upstream: z.array(z.string()),
  tests: z.array(z.enum(["unit", "integration", "acceptance"])),
});

export type Workstream = z.infer<typeof WorkstreamSchema>;

export const ResourceRunSchema = z.object({ status: z.number().nullable(), output: z.string() });
export type ResourceRun = z.infer<typeof ResourceRunSchema>;

export const GaugeReportSchema = z.array(
  z.object({
    name: z.string(),
    assertions: z.array(z.object({ requirement: z.string(), scenario: z.string(), passed: z.boolean() })),
  }),
);

export type GaugeReport = z.infer<typeof GaugeReportSchema>;

export const FinalInspectionSchema = z.object({
  name: z.string(),
  repository: z.boolean(),
  drawings: InspectionDrawingsSchema,
  workstreams: z.array(WorkstreamSchema),
  procedures: z.array(ProcedureSchema),
  platform: z.string(),
  review: z.object({ hasRubric: z.boolean(), keyVariable: z.string(), configured: z.boolean() }),
});

export type FinalInspection = z.infer<typeof FinalInspectionSchema>;
