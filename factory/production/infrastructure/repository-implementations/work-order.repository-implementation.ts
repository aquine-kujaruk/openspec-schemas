

import type { WorkOrderRepositoryInterface } from "../../application/repository-interfaces/work-order.repository-interface.ts";
import { WorkOrderAggregate } from "../../domain/aggregates/work-order.aggregate.ts";
import { PlanEntity } from "../../domain/entities/plan.entity.ts";
import { StageEntity } from "../../domain/entities/stage.entity.ts";
import { WorkOrderException } from "../../domain/exceptions/work-order.exceptions.ts";
import { parsePlan, deltaRequirementsOf } from "../../domain/schemas/plan-document.schema.ts";
import { AndonPullValueObject } from "../../domain/value-objects/andon-pull.value-object.ts";
import { DecisionValueObject } from "../../domain/value-objects/decision.value-object.ts";
import { DrawingRevisionValueObject } from "../../domain/value-objects/drawing-revision.value-object.ts";
import { OperationValueObject } from "../../domain/value-objects/operation.value-object.ts";
import type { WorkOrderName } from "../../domain/schemas/work-order-name.schema.ts";
import { WorkOrderRecordSchema, type WorkOrderAcl } from "../acl/work-order.acl.ts";

export class WorkOrderRepositoryImplementation implements WorkOrderRepositoryInterface {
  private readonly files: WorkOrderAcl;

  constructor(files: WorkOrderAcl) {
    this.files = files;
  }

  async findWorkOrder(name: WorkOrderName): Promise<WorkOrderAggregate | null> {
    try {
      const source = await this.files.readOrder(name);
      if (!source) return null;
      const { plan, process, line, revisions, andon } = WorkOrderRecordSchema.parse(source);
      const document = parsePlan(plan);

      return new WorkOrderAggregate({
        name,
        process: process,
        line: line === undefined ? undefined : line,
        plan: new PlanEntity({
          stages: document.phases.map(({title, tasks}) => new StageEntity({
            title,
            operations: tasks.map(({text, done, workstream}) => new OperationValueObject({
              text, done, workCenter: workstream,
            })),
          })),
          decisions: document.changeDecisions.flatMap(({text, tags}) => {
            const by = tags.find(({name}) => name === "by")?.value;

            return by === "person" || by === "agent" ? [new DecisionValueObject({text, by})] : [];
          }),
          openQuestions: document.openQuestions,
          releasedOn: /^\d{4}-\d{2}-\d{2}$/.test(document.approvedAt ?? "") ? document.approvedAt : undefined,
        }),
        revisions: revisions.map(({drawing, document}) => new DrawingRevisionValueObject({
          drawing,
          requirements: deltaRequirementsOf(document).map(({name}) => ({ name })),
        })),
        andonPulls: andon.map((signal) => new AndonPullValueObject(signal)),
      });
    } catch (cause) {
      throw new WorkOrderException(`Could not read work order ${name}`, { cause });
    }
  }

  async listWorkOrders(): Promise<WorkOrderAggregate[]> {
    const names = await this.files.listOrders();
    const orders = await Promise.all(names.map((value) => this.findWorkOrder(value)));

    return orders.filter((order) => order !== null);
  }

  async saveWorkOrder(order: WorkOrderAggregate): Promise<void> {
    await this.files.writeRelease(order.name, order.plan.releasedOn);
  }
}
