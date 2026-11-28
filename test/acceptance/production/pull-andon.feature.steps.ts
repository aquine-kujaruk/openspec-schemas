// Synced by feat2test. Matching step implementations are preserved.

import { expect } from "vitest";
import { PlanTextEntity } from "../../../factory/production/domain/entities/plan-text.entity.ts";
import { PullAndonUseCase } from "../../../factory/production/application/use-cases/pull-andon.use-case.ts";
import { ValidateWorkOrderUseCase } from "../../../factory/production/application/use-cases/validate-work-order.use-case.ts";
import { InMemoryAndonRepository } from "./repositories/in-memory-andon.repository.ts";
import { InMemoryWorkOrderValidationRepository } from "./repositories/in-memory-work-order-validation.repository.ts";

const section = (plan: string, heading: string): string =>
  plan.split(`\n## ${heading}\n`)[1]?.split("\n## ")[0] ?? "";

const listItems = (text: string): string[] => text.split("\n").filter((line) => line.startsWith("- "));

const completedPhases = (plan: string): number[] =>
  section(plan, "Phases").split(/^### Phase /m).slice(1).flatMap((phase, index) => {
    const tasks = listItems(phase);
    return tasks.length && tasks.every((task) => /^- \[[xX]\]/.test(task)) ? [index + 1] : [];
  });

const planOf = (name: string, phases: boolean[], previousEntries: number): string =>
  [
    `---\nname: ${name}\napproved_at: 2026-11-12\n---`,
    `# ${name}`,
    "## Goal\n\nOrders can be listed.",
    "## Decisions",
    "## Open questions",
    "## Architecture decisions",
    "## Procedures",
    "## Phases",
    ...phases.map((done, i) => {
      const task = (text: string) => `- [${done ? "x" : " "}] ${text}`;
      return [
        `### Phase ${i + 1}: Step ${i + 1} works`,
        task(`app-domain: build step ${i + 1}`),
        task("modules: verify the phase"),
      ].join("\n\n");
    }),
    "## Feedback",
    ...Array.from({ length: previousEntries }, (_, i) => `- **the person**: earlier entry ${i + 1}`),
    "## Next step",
  ].join("\n\n");

export function createSteps() {
  const repository = new InMemoryAndonRepository();
  const validation = new InMemoryWorkOrderValidationRepository();
  validation.seed(async (name) => repository.activeNames().includes(name) ? repository.readPlan(name) : null);

  const pull = new PullAndonUseCase(repository);
  const validate = new ValidateWorkOrderUseCase(validation);
  let count = 1;
  let about = "add-orders";
  let entries = 0;
  let done: number[] = [];
  let named: number | undefined;
  let decisions = 0;
  let approvedScope = false;
  let determinateRule = false;
  let action: string;

  return {
    // Context
    activeChangesAmong(activeBefore: string, change: string): void {
      count = Number(activeBefore);
      about = change;
    },
    planFeedbackEntriesBefore(change: string, entriesBefore: string): void {
      expect(change).toBe(about);
      entries = Number(entriesBefore);
    },
    reviewerRepairAuthority(authority: string): void {
      approvedScope = authority === "repair in the owned repo";
    },
    standingRuleGives(rule: string): void {
      determinateRule = rule === "one specified outcome";
    },
    phasesDoneBefore(doneBefore: string): void {
      done = doneBefore === "none" ? [] : doneBefore.split(", ").map(Number);
    },
    feedbackNamesPhase(phase: string): void {
      named = Number(phase);
    },
    feedbackNeedsDecisions(open: string): void {
      decisions = Number(open);
    },

    // Action
    async takeInFeedback(source: string, change: string): Promise<void> {
      const phases = Array.from(
        { length: Math.max(2, named ?? 0, ...done) },
        (_, i) => done.includes(i + 1),
      );
      repository.seed(about, planOf(about, phases, entries));
      for (let i = 1; i < count; i++) {
        const other = `other-${i}`;
        repository.seed(other, planOf(other, [false], 0));
      }
      await pull.execute(change, {
        source,
        says: "the list must come newest first",
        phase: named,
        questions: Array.from(
          { length: decisions },
          (_, i) => `Which order wins a tie ${i + 1}?`,
        ),
      });
    },
    takeReviewerFinding(): void {
      action = PlanTextEntity.repairAction(approvedScope, determinateRule);
    },

    // Outcome
    activeChangesAfter(activeAfter: string): void {
      expect(repository.activeNames()).toHaveLength(Number(activeAfter));
    },
    async planFeedbackEntriesAfter(change: string, entriesAfter: string): Promise<void> {
      expect(change).toBe(about);
      const feedback = section(await repository.readPlan(change), "Feedback");
      expect(listItems(feedback)).toHaveLength(Number(entriesAfter));
    },
    reviewerFindingAction(next: string): void {
      expect(action).toBe(next);
    },
    async phasesDoneAfter(doneAfter: string): Promise<void> {
      const still = completedPhases(await repository.readPlan(about));
      expect(still.join(", ") || "none").toBe(doneAfter);
    },
    async planListsOpenQuestions(change: string, open: string): Promise<void> {
      expect(change).toBe(about);
      const questions = section(await repository.readPlan(change), "Open questions");
      expect(listItems(questions)).toHaveLength(Number(open));
    },
    async validationReportsChange(readiness: string): Promise<void> {
      const verdict = await validate.execute(about);
      expect(verdict.ready ? "ready" : "not ready", JSON.stringify(verdict)).toBe(readiness);
    },
  };
}
