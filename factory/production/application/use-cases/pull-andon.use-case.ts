import { PlanTextEntity } from "../../domain/entities/plan-text.entity.ts";
import type { PlanFeedback } from "../../domain/schemas/plan-text.schema.ts";
import type { AndonRepositoryInterface } from "../repository-interfaces/andon.repository-interface.ts";

export class PullAndonUseCase {
  private readonly signals: AndonRepositoryInterface;

  constructor(signals: AndonRepositoryInterface) {
    this.signals = signals;
  }

  async execute(name: string, feedback: PlanFeedback): Promise<void> {
    const plan = new PlanTextEntity({ change: name, text: await this.signals.readPlan(name) }).withFeedback(feedback);

    await this.signals.savePlan(name, plan.text);
    await this.signals.closeSignal(name, feedback.source);
  }
}
