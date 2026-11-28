import { validateSchema } from "../../../shared/domain/schemas/validation.schema.ts";
import type { LineName } from "../../../shared/domain/schemas/line-name.schema.ts";
import type { ProcessName } from "../../../shared/domain/schemas/process-name.schema.ts";
import { PlanEntity } from "../entities/plan.entity.ts";
import { StageEntity } from "../entities/stage.entity.ts";
import { WorkOrderException } from "../exceptions/work-order.exceptions.ts";
import type { Day } from "../schemas/day.schema.ts";
import { WorkOrderRecordSchema, WorkOrderSchema, type WorkOrderProps, type WorkOrderRecord } from "../schemas/work-order.schema.ts";
import { deltaRequirementsOf, parsePlan } from "../schemas/plan-document.schema.ts";
import { DecisionValueObject } from "../value-objects/decision.value-object.ts";
import { OperationValueObject } from "../value-objects/operation.value-object.ts";
import { AndonPullValueObject } from "../value-objects/andon-pull.value-object.ts";
import { DrawingRevisionValueObject } from "../value-objects/drawing-revision.value-object.ts";
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

  static from(record: WorkOrderRecord): WorkOrderAggregate {
    const { name, process, line, plan, revisions, andon } = WorkOrderRecordSchema.parse(record);
    const document = parsePlan(plan);

    return new WorkOrderAggregate({
      name,
      process,
      line,
      plan: new PlanEntity({
        stages: document.phases.map(({ title, tasks }) => new StageEntity({
          title,
          operations: tasks.map(({ text, done, workstream }) => new OperationValueObject({ text, done, workCenter: workstream })),
        })),
        decisions: document.changeDecisions.flatMap(({ text, tags }) => {
          const by = tags.find((tag) => tag.name === "by")?.value;

          return by === "person" || by === "agent" ? [new DecisionValueObject({ text, by })] : [];
        }),
        openQuestions: document.openQuestions,
        releasedOn: /^\d{4}-\d{2}-\d{2}$/.test(document.approvedAt ?? "") ? document.approvedAt : undefined,
      }),
      revisions: revisions.map(({ drawing, document: delta }) => new DrawingRevisionValueObject({
        drawing,
        requirements: deltaRequirementsOf(delta).map((requirement) => ({ name: requirement.name })),
      })),
      andonPulls: andon.map((signal) => new AndonPullValueObject(signal)),
    });
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
