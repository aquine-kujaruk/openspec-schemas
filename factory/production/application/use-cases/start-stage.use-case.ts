
import type { WorkOrderRepositoryInterface } from "../repository-interfaces/work-order.repository-interface.ts";
import type { StageStartRepositoryInterface } from "../repository-interfaces/stage-start.repository-interface.ts";

type Started = { state: "started"; phase: string; tasks: string[] }
  | { state: "not ready" | "cannot start"; findings: string[] }
  | { state: "cannot validate"; message: string }
  | { state: "nothing to build" };

export class StartStageUseCase {
  private readonly orders: WorkOrderRepositoryInterface;
  private readonly setup: StageStartRepositoryInterface;

  constructor(orders: WorkOrderRepositoryInterface, setup: StageStartRepositoryInterface) {
    this.orders = orders;
    this.setup = setup;
  }

  async execute(name: string): Promise<Started> {
    const findings = await this.setup.validateWorkOrder(name);
    const invalid = findings.find(({rule}) => rule === "not-validatable");
    if (invalid) return { state: "cannot validate", message: invalid.message };

    if (findings.length) return {
      state: "not ready",
      findings: findings.map(({rule, message}) => `[${rule}] ${message}`),
    };

    const order = await this.orders.findWorkOrder(name);

    if (!order || order.plan.stages.every(({complete}) => complete))
      return { state: "nothing to build" };

    const stage = order.startNextStage();
    const prepared = await this.setup.prepareStage(name, stage.title);
    if (!prepared.success) return { state: "cannot start", findings: [prepared.output] };

    return { state: "started", phase: stage.title, tasks: stage.operations.filter(({done}) => !done).map(({text}) => text) };
  }
}
