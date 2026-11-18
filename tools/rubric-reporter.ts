import { rubricWarnings } from "../factory/quality/infrastructure/adapters/rubric-case.adapter.ts";
import type { Reporter, TestCase } from "vitest/node";
import type { ReportedScore } from "./rubric-steps.ts";

export class RubricReporter implements Reporter {
  private scores: ReportedScore[] = [];

  onTestRunStart() {
    this.scores = [];
  }

  onTestCaseResult(test: TestCase) {
    const score = (test.meta() as { rubricScore?: ReportedScore }).rubricScore;
    if (score) this.scores.push(score);
  }

  onTestRunEnd() {
    if (!this.scores.length) return;
    console.log("\nRubric judgements");
    for (const result of this.scores.sort((a, b) =>
      a.layer.localeCompare(b.layer) || a.row.localeCompare(b.row) || a.name.localeCompare(b.name))) {
      const delta = result.delta === undefined ? "—" : result.delta.toFixed(3);
      const changes = result.changed.length ? " · changed " + result.changed.join(", ") : "";
      const warnings = rubricWarnings(result).map(warning => " · WARNING " + warning).join("");
      console.log(`${result.layer} ${result.row}/${result.name} · history [${result.history.join(", ")}] · p=${result.score} · expected ${result.expected} · confidence ${(100 * result.confidence).toFixed(1)}% · Δ ${delta} · ${result.state} · ${result.replayed ? "replay" : "live"}${changes}${warnings}`);
    }
  }
}
