import type { AndonRepositoryInterface } from "../../../../factory/production/application/repository-interfaces/andon.repository-interface.ts";

export class InMemoryAndonRepository implements AndonRepositoryInterface {
  private readonly plans = new Map<string, string>();
  readonly closedSignals: Array<{ name: string; source: string }> = [];

  seed(name: string, plan: string): void {
    this.plans.set(name, plan);
  }

  activeNames(): string[] {
    return [...this.plans.keys()];
  }

  async readPlan(name: string): Promise<string> {
    return this.plans.get(name) ?? "";
  }

  async savePlan(name: string, text: string): Promise<void> {
    this.plans.set(name, text);
  }

  async closeSignal(name: string, source: string): Promise<void> {
    this.closedSignals.push({ name, source });
  }
}
