import { z } from "zod";

export const RulesLedgerSchema = z.record(z.string(), z.string());

export const RulesRecordSchema = z.object({ rules: RulesLedgerSchema });

export const RuleChange = {
  Added: "added",
  Changed: "changed",
  Removed: "removed",
  Unchanged: "unchanged",
} as const;

export const RuleConformanceSchema = z.object({
  rule: z.string().min(1),
  change: z.enum(RuleChange),
  files: z.array(z.string()),
});

export type RulesLedger = z.infer<typeof RulesLedgerSchema>;
export type RulesRecord = z.infer<typeof RulesRecordSchema>;
export type RuleConformance = z.infer<typeof RuleConformanceSchema>;
