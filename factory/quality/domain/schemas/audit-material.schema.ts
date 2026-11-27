import { z } from "zod";

export const AuditRowSchema = z.object({
  id: z.string(),
  title: z.string(),
  question: z.string(),
  folders: z.array(z.string()),
  crossFile: z.boolean(),
});
export type AuditRow = z.infer<typeof AuditRowSchema>;

export const LoadedAuditRowSchema = AuditRowSchema.extend({
  verdict: z.enum(["accepted", "rejected"]),
  reason: z.string().optional(),
});
export type LoadedAuditRow = z.infer<typeof LoadedAuditRowSchema>;

export const AuditSourceSchema = z.object({ path: z.string(), content: z.string() });
export type AuditSource = z.infer<typeof AuditSourceSchema>;
export const AuditFileSchema = AuditSourceSchema.extend({ folder: z.string() });
export type AuditFile = z.infer<typeof AuditFileSchema>;
export type AuditSpan = { from: number; to: number; label: string; parts: AuditSpan[] };

export const AuditQuestionSchema = z.object({
  name: z.string(),
  instructions: z.string(),
  excerpt: z.string(),
});
export type AuditQuestion = z.infer<typeof AuditQuestionSchema>;

export type AuditAnswers = Map<string, number>;

export const AuditRubricSchema = z.object({ path: z.string(), markdown: z.string() });
export type AuditRubric = z.infer<typeof AuditRubricSchema>;

export const AuditPassSchema = z.object({
  rubric: z.string().optional(),
  files: z.record(z.string(), z.object({ hash: z.string(), commit: z.string().nullable() })),
});
export type AuditPass = z.infer<typeof AuditPassSchema>;
