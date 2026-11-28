import { describe, expect, it } from "vitest";
import { RuleConformanceService } from "../../../../../factory/quality/domain/services/rule-conformance.service.ts";

const ledgers = new RuleConformanceService();

describe("rules ledger", () => {
  it("names each rule added, changed, removed or unchanged since the record", () => {
    const changes = ledgers.compare({ kept: "a", tightened: "b", retired: "c" }, { kept: "a", tightened: "B", fresh: "d" });

    expect(changes).toEqual([
      { rule: "kept", change: "unchanged" },
      { rule: "tightened", change: "changed" },
      { rule: "fresh", change: "added" },
      { rule: "retired", change: "removed" },
    ]);
  });

  it("treats every rule as added when the project has no record", () => {
    expect(ledgers.compare(undefined, { fresh: "d" })).toEqual([{ rule: "fresh", change: "added" }]);
  });

  it("checks only the deterministic rules that are added or changed", () => {
    const changes = ledgers.compare({ kept: "a", S20: "x" }, { kept: "a", S20: "y", fresh: "d" });

    expect(ledgers.toCheck(changes, new Set(["kept", "fresh"]))).toEqual(["fresh"]);
  });

  it("keeps the broken files only for added or changed rules", () => {
    const changes = ledgers.compare({ kept: "a" }, { kept: "a", fresh: "d" });
    const broken = new Map([["kept", ["src/a.ts"]], ["fresh", ["src/b.ts"]]]);

    expect(ledgers.conformance(changes, broken)).toEqual([
      { rule: "kept", change: "unchanged", files: [] },
      { rule: "fresh", change: "added", files: ["src/b.ts"] },
    ]);
  });
});
