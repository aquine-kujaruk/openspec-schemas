import { RuleChange, type RuleConformance, type RulesLedger } from "../schemas/rules-ledger.schema.ts";

export class RuleConformanceService {
  compare(recorded: RulesLedger | undefined, installed: RulesLedger): Array<Pick<RuleConformance, "rule" | "change">> {
    const before = recorded ?? {};

    const present = Object.entries(installed).map(([rule, hash]) => ({
      rule,
      change: !(rule in before)
        ? RuleChange.Added
        : before[rule] === hash ? RuleChange.Unchanged : RuleChange.Changed,
    }));

    const removed = Object.keys(before)
      .filter((rule) => !(rule in installed))
      .map((rule) => ({ rule, change: RuleChange.Removed }));

    return [...present, ...removed];
  }

  conformance(
    changes: Array<Pick<RuleConformance, "rule" | "change">>,
    broken: Map<string, string[]>,
  ): RuleConformance[] {
    return changes.map(({ rule, change }) => ({
      rule,
      change,
      files: change === RuleChange.Added || change === RuleChange.Changed ? broken.get(rule) ?? [] : [],
    }));
  }

  toCheck(changes: Array<Pick<RuleConformance, "rule" | "change">>, deterministic: Set<string>): string[] {
    return changes
      .filter(({ rule, change }) => deterministic.has(rule) && (change === RuleChange.Added || change === RuleChange.Changed))
      .map(({ rule }) => rule);
  }
}
