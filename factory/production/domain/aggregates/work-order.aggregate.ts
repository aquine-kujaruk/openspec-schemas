import { validateSchema } from "../../../shared/domain/schemas/validation.schema.ts";
import type { LineName } from "../../../shared/domain/value-objects/line-name.value-object.ts";
import type { ProcessName } from "../../../shared/domain/value-objects/process-name.value-object.ts";
import { Plan } from "../entities/plan.entity.ts";
import type { Stage } from "../entities/stage.entity.ts";
import { WorkOrderException } from "../exceptions/work-order.exceptions.ts";
import type { Day } from "../schemas/day.schema.ts";
import { WorkOrderSchema, type WorkOrderProps } from "../schemas/work-order.schema.ts";
import type { AndonPull } from "../value-objects/andon-pull.value-object.ts";
import type { DrawingRevision } from "../value-objects/drawing-revision.value-object.ts";
import type { WorkOrderName } from "../value-objects/work-order-name.value-object.ts";

export type ClosedWorkOrder = {
  readonly name: WorkOrderName;
  readonly process: ProcessName;
  readonly line?: LineName;
  readonly plan: Plan;
  readonly revisions: readonly DrawingRevision[];
  readonly andonPulls: readonly AndonPull[];
  readonly closedOn: Day;
};

export class WorkOrder {
  readonly name!: WorkOrderName;
  readonly process!: ProcessName;
  readonly line?: LineName;
  readonly revisions!: DrawingRevision[];
  readonly andonPulls!: AndonPull[];
  private currentPlan!: Plan;

  constructor(props: WorkOrderProps) {
    validateSchema(this, WorkOrderSchema, props);
  }

  get plan(): Plan {
    return this.currentPlan;
  }

  release(on: Day): void {
    if (this.plan.openQuestions.length)
      throw new WorkOrderException("the plan has open questions");
    this.currentPlan = new Plan({ ...this.plan, releasedOn: on });
  }

  startNextStage(): Stage {
    this.requireRelease();
    const next = this.plan.stages.find((stage) => !stage.complete);
    if (!next) throw new WorkOrderException("nothing to build");
    return next;
  }

  close(on: Day): ClosedWorkOrder {
    this.requireRelease();
    return {
      name: this.name,
      process: this.process,
      line: this.line,
      plan: this.plan,
      revisions: [...this.revisions],
      andonPulls: [...this.andonPulls],
      closedOn: on,
    };
  }

  private requireRelease(): void {
    if (!this.plan.releasedOn)
      throw new WorkOrderException("the plan has not been released");
    if (this.plan.openQuestions.length)
      throw new WorkOrderException("the plan has open questions");
  }
}
