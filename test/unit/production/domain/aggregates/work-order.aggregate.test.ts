import { describe, expect, it } from "vitest";
import { WorkOrderAggregate } from "../../../../../factory/production/domain/aggregates/work-order.aggregate.ts";
import { PlanEntity } from "../../../../../factory/production/domain/entities/plan.entity.ts";
import { StageEntity } from "../../../../../factory/production/domain/entities/stage.entity.ts";
import { WorkOrderException } from "../../../../../factory/production/domain/exceptions/work-order.exceptions.ts";
import { OperationValueObject } from "../../../../../factory/production/domain/value-objects/operation.value-object.ts";
import { AndonPullValueObject } from "../../../../../factory/production/domain/value-objects/andon-pull.value-object.ts";
import { DrawingRevisionValueObject } from "../../../../../factory/production/domain/value-objects/drawing-revision.value-object.ts";




const RELEASED_ON = "2026-11-17";
const CLOSED_ON = "2026-11-20";

const stage = (title: string, ...done: boolean[]) =>
  new StageEntity({
    title,
    operations: done.map((finished, at) => new OperationValueObject({
      text: `Operation ${at + 1}`,
      done: finished,
    })),
  });

const orderFor = (plan: PlanEntity) => new WorkOrderAggregate({
  name: "list-orders",
  process: "clean-backend",
  line: "api",
  plan,
  revisions: [new DrawingRevisionValueObject({
    drawing: "specs/orders/list-orders/spec.md",
    requirements: [{ name: "Orders are listed", operation: "adds", by: "person" }],
  })],
  andonPulls: [new AndonPullValueObject({
    from: "the implement phase",
    names: "orders",
    says: "Define the default sort",
  })],
});

describe("a work order", () => {
  it("records release before a stage can start", () => {
    const first = stage("Build", false);
    const order = orderFor(new PlanEntity({ stages: [first] }));

    expect(() => order.startNextStage()).toThrow(WorkOrderException);
    order.release(RELEASED_ON);

    expect(order.plan.releasedOn).toBe(RELEASED_ON);
    expect(order.startNextStage()).toBe(first);
  });

  it("refuses release and progression while the plan has open questions", () => {
    const stages = [stage("Build", false)];
    const openQuestions = ["Which currency?"];
    const order = orderFor(new PlanEntity({ stages, openQuestions }));
    const reopened = orderFor(new PlanEntity({ stages, openQuestions, releasedOn: RELEASED_ON }));

    expect(() => order.release(RELEASED_ON)).toThrow("the plan has open questions");
    expect(() => reopened.startNextStage()).toThrow("the plan has open questions");
  });

  it("selects the first stage with an unchecked operation and does not tick it", () => {
    const finished = stage("Build", true);
    const next = stage("Verify", true, false);
    const later = stage("Roll out", false);
    const order = orderFor(new PlanEntity({ stages: [finished, next, later], releasedOn: RELEASED_ON }));

    expect(order.startNextStage()).toBe(next);
    expect(order.startNextStage()).toBe(next);
    expect(next.operations.map((operation) => operation.done)).toEqual([true, false]);
  });

  it("has no stage to start when every operation is checked", () => {
    const order = orderFor(new PlanEntity({ stages: [stage("Build", true)], releasedOn: RELEASED_ON }));

    expect(() => order.startNextStage()).toThrow("nothing to build");
  });

  it("takes a dated snapshot that stands apart from a later release", () => {
    const order = orderFor(new PlanEntity({ stages: [], releasedOn: RELEASED_ON }));
    const closed = order.close(CLOSED_ON);
    order.release("2026-11-18");

    expect(closed).toMatchObject({
      name: "list-orders",
      line: "api",
      plan: { releasedOn: RELEASED_ON },
      closedOn: CLOSED_ON,
      revisions: [{ drawing: "specs/orders/list-orders/spec.md" }],
      andonPulls: [{ names: "orders" }],
    });
    expect(closed.revisions).not.toBe(order.revisions);
    expect(closed.andonPulls).not.toBe(order.andonPulls);
  });
});
