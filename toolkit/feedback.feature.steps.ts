import { mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect } from "vitest";
import { activeChanges } from "./change.ts";
import { takeIn } from "./feedback.ts";
import { parsePlan } from "./plan.ts";
import { change as writeChange } from "./testing.ts";
import { validateChange } from "./validate.ts";

/** Each scenario takes feedback into one change of a project of its own, written when the feedback is taken in. */
export function createSteps() {
  const root = mkdtempSync(join(tmpdir(), "feedback-"));
  let count = 1;
  let about = "add-orders";
  let entries = 0;
  let done: number[] = [];
  let named: number | undefined;
  let decisions = 0;

  const plan = () => readFileSync(join(root, "openspec/changes", about, "plan.md"), "utf8");
  const project = () => {
    const phases = Array.from({ length: Math.max(2, named ?? 0, ...done) }, (_, i) =>
      done.includes(i + 1),
    );
    writeChange(root, about, {
      parts: {
        phases,
        feedback: Array.from({ length: entries }, (_, i) => `**the person**: earlier entry ${i + 1}`),
      },
    });
    for (let i = 1; i < count; i++) writeChange(root, `other-${i}`);
  };

  return {
    // Context
    async activeChangesAmong(activeBefore: string, change: string): Promise<void> {
      count = Number(activeBefore);
      about = change;
    },
    async planFeedbackEntriesBefore(change: string, entriesBefore: string): Promise<void> {
      expect(change).toBe(about);
      entries = Number(entriesBefore);
    },
    async phasesDoneBefore(doneBefore: string): Promise<void> {
      done = doneBefore === "none" ? [] : doneBefore.split(", ").map(Number);
    },
    async feedbackNamesPhase(phase: string): Promise<void> {
      named = Number(phase);
    },
    async feedbackNeedsDecisions(open: string): Promise<void> {
      decisions = Number(open);
    },

    // Action
    async takeInFeedback(source: string, change: string): Promise<void> {
      project();
      takeIn(root, change, {
        source,
        says: "the list must come newest first",
        phase: named,
        questions: Array.from({ length: decisions }, (_, i) => `Which order wins a tie ${i + 1}?`),
      });
    },

    // Outcome
    async activeChangesAfter(activeAfter: string): Promise<void> {
      expect(activeChanges(root)).toHaveLength(Number(activeAfter));
    },
    async planFeedbackEntriesAfter(change: string, entriesAfter: string): Promise<void> {
      expect(change).toBe(about);
      const section = plan().split(/^## Feedback$/m)[1]!.split(/^## /m)[0]!;
      expect(section.split("\n").filter((l) => l.startsWith("- "))).toHaveLength(Number(entriesAfter));
    },
    async phasesDoneAfter(doneAfter: string): Promise<void> {
      const still = parsePlan(plan())
        .phases.map((p, i) => (p.tasks.every((t) => t.done) ? i + 1 : 0))
        .filter(Boolean);
      expect(still.join(", ") || "none").toBe(doneAfter);
    },
    async planListsOpenQuestions(change: string, open: string): Promise<void> {
      expect(change).toBe(about);
      expect(parsePlan(plan()).openQuestions).toHaveLength(Number(open));
    },
    async validationReportsChange(readiness: string): Promise<void> {
      const verdict = await validateChange(root, about);
      expect(verdict.ready ? "ready" : "not ready", JSON.stringify(verdict.findings)).toBe(readiness);
    },
  };
}
