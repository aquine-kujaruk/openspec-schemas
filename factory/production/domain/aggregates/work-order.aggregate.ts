import { validateSchema } from "../../../shared/domain/schemas/validation.schema.ts";
import type { LineName } from "../../../shared/domain/schemas/line-name.schema.ts";
import type { ProcessName } from "../../../shared/domain/schemas/process-name.schema.ts";
import { PlanEntity } from "../entities/plan.entity.ts";
import type { StageEntity } from "../entities/stage.entity.ts";
import { WorkOrderException } from "../exceptions/work-order.exceptions.ts";
import type { Day } from "../schemas/day.schema.ts";
import { WorkOrderSchema, type WorkOrderProps } from "../schemas/work-order.schema.ts";
import type { AndonPullValueObject } from "../value-objects/andon-pull.value-object.ts";
import type { DrawingRevisionValueObject } from "../value-objects/drawing-revision.value-object.ts";
import type { WorkOrderName } from "../schemas/work-order-name.schema.ts";

export type ClosedWorkOrder = {
  readonly name: WorkOrderName;
  readonly process: ProcessName;
  readonly line?: LineName;
  readonly plan: PlanEntity;
  readonly revisions: readonly DrawingRevisionValueObject[];
  readonly andonPulls: readonly AndonPullValueObject[];
  readonly closedOn: Day;
};

export class WorkOrderAggregate {
  readonly name!: WorkOrderName;
  readonly process!: ProcessName;
  readonly line?: LineName;
  readonly revisions!: DrawingRevisionValueObject[];
  readonly andonPulls!: AndonPullValueObject[];
  private currentPlan!: PlanEntity;

  constructor(props: WorkOrderProps) {
    validateSchema(this, WorkOrderSchema, props);
  }

  get plan(): PlanEntity {
    return this.currentPlan;
  }

  release(on: Day): void {
    if (this.plan.openQuestions.length)
      throw new WorkOrderException("the plan has open questions");
    this.currentPlan = new PlanEntity({ ...this.plan, releasedOn: on });
  }

  startNextStage(): StageEntity {
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
