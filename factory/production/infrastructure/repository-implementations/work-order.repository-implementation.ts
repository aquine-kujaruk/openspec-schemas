import { LineName } from "../../../shared/domain/value-objects/line-name.value-object.ts";
import { ProcessName } from "../../../shared/domain/value-objects/process-name.value-object.ts";
import type { WorkOrderRepositoryInterface } from "../../application/repository-interfaces/work-order.repository-interface.ts";
import { WorkOrder } from "../../domain/aggregates/work-order.aggregate.ts";
import { Plan } from "../../domain/entities/plan.entity.ts";
import { Stage } from "../../domain/entities/stage.entity.ts";
import { WorkOrderException } from "../../domain/exceptions/work-order.exceptions.ts";
import { parsePlan, deltaRequirementsOf } from "../../domain/schemas/plan-document.schema.ts";
import { AndonPull } from "../../domain/value-objects/andon-pull.value-object.ts";
import { Decision } from "../../domain/value-objects/decision.value-object.ts";
import { DrawingRevision } from "../../domain/value-objects/drawing-revision.value-object.ts";
import { Operation } from "../../domain/value-objects/operation.value-object.ts";
import { WorkOrderName } from "../../domain/value-objects/work-order-name.value-object.ts";
import { WorkOrderRecordSchema, type WorkOrderAcl } from "../acl/work-order.acl.ts";

export class WorkOrderRepositoryImplementation implements WorkOrderRepositoryInterface {
  private readonly files: WorkOrderAcl;

  constructor(files: WorkOrderAcl) {
    this.files = files;
  }

  async findWorkOrder(name: WorkOrderName): Promise<WorkOrder | null> {
    try {
      const source = await this.files.readOrder(name.value);
      if (!source) return null;
      const { plan, process, line, revisions, andon } = WorkOrderRecordSchema.parse(source);
      const document = parsePlan(plan);
      return new WorkOrder({
        name,
        process: new ProcessName({value: process}),
        line: line === undefined ? undefined : new LineName({value: line}),
        plan: new Plan({
          stages: document.phases.map(({title, tasks}) => new Stage({
            title,
            operations: tasks.map(({text, done, workstream}) => new Operation({
              text, done, workCenter: workstream,
            })),
          })),
          decisions: document.changeDecisions.flatMap(({text, tags}) => {
            const by = tags.find(({name}) => name === "by")?.value;
            return by === "person" || by === "agent" ? [new Decision({text, by})] : [];
          }),
          openQuestions: document.openQuestions,
          releasedOn: /^\d{4}-\d{2}-\d{2}$/.test(document.approvedAt ?? "") ? document.approvedAt : undefined,
        }),
        revisions: revisions.map(({drawing, document}) => new DrawingRevision({
          drawing,
          requirements: deltaRequirementsOf(document).map(({name}) => ({ name })),
        })),
        andonPulls: andon.map((signal) => new AndonPull(signal)),
      });
    } catch (cause) {
      throw new WorkOrderException(`Could not read work order ${name.value}`, { cause });
    }
  }

  async listWorkOrders(): Promise<WorkOrder[]> {
    const names = await this.files.listOrders();
    const orders = await Promise.all(names.map((value) => this.findWorkOrder(new WorkOrderName({value}))));
    return orders.filter((order) => order !== null);
  }

  async saveWorkOrder(order: WorkOrder): Promise<void> {
    await this.files.writeRelease(order.name.value, order.plan.releasedOn);
  }
}
