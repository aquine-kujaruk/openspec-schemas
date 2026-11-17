import { describe, expect, it } from "vitest";
import { WorkOrder } from "../../../../../factory/production/domain/aggregates/work-order.aggregate.ts";
import { Plan } from "../../../../../factory/production/domain/entities/plan.entity.ts";
import { Stage } from "../../../../../factory/production/domain/entities/stage.entity.ts";
import { WorkOrderException } from "../../../../../factory/production/domain/exceptions/work-order.exceptions.ts";
import { Operation } from "../../../../../factory/production/domain/value-objects/operation.value-object.ts";
import { AndonPull } from "../../../../../factory/production/domain/value-objects/andon-pull.value-object.ts";
import { DrawingRevision } from "../../../../../factory/production/domain/value-objects/drawing-revision.value-object.ts";
import { WorkOrderName } from "../../../../../factory/production/domain/value-objects/work-order-name.value-object.ts";
import { LineName } from "../../../../../factory/shared/domain/value-objects/line-name.value-object.ts";
import { ProcessName } from "../../../../../factory/shared/domain/value-objects/process-name.value-object.ts";

const RELEASED_ON = "2026-11-17";
const CLOSED_ON = "2026-11-20";

const stage = (title: string, ...done: boolean[]) =>
  new Stage({
    title,
    operations: done.map((finished, at) => new Operation({
      text: `Operation ${at + 1}`,
      done: finished,
    })),
  });

const orderFor = (plan: Plan) => new WorkOrder({
  name: new WorkOrderName({ value: "list-orders" }),
  process: new ProcessName({ value: "clean-backend" }),
  line: new LineName({ value: "api" }),
  plan,
  revisions: [new DrawingRevision({
    drawing: "specs/orders/list-orders/spec.md",
    requirements: [{ name: "Orders are listed", operation: "adds", by: "person" }],
  })],
  andonPulls: [new AndonPull({
    from: "the implement phase",
    names: "orders",
    says: "Define the default sort",
  })],
});

describe("a work order", () => {
  it("records release before a stage can start", () => {
    const first = stage("Build", false);
    const order = orderFor(new Plan({ stages: [first] }));

    expect(() => order.startNextStage()).toThrow(WorkOrderException);
    order.release(RELEASED_ON);

    expect(order.plan.releasedOn).toBe(RELEASED_ON);
    expect(order.startNextStage()).toBe(first);
  });

  it("refuses release and progression while the plan has open questions", () => {
    const stages = [stage("Build", false)];
    const openQuestions = ["Which currency?"];
    const order = orderFor(new Plan({ stages, openQuestions }));
    const reopened = orderFor(new Plan({ stages, openQuestions, releasedOn: RELEASED_ON }));

    expect(() => order.release(RELEASED_ON)).toThrow("the plan has open questions");
    expect(() => reopened.startNextStage()).toThrow("the plan has open questions");
  });

  it("selects the first stage with an unchecked operation and does not tick it", () => {
    const finished = stage("Build", true);
    const next = stage("Verify", true, false);
    const later = stage("Roll out", false);
    const order = orderFor(new Plan({ stages: [finished, next, later], releasedOn: RELEASED_ON }));

    expect(order.startNextStage()).toBe(next);
    expect(order.startNextStage()).toBe(next);
    expect(next.operations.map((operation) => operation.done)).toEqual([true, false]);
  });

  it("has no stage to start when every operation is checked", () => {
    const order = orderFor(new Plan({ stages: [stage("Build", true)], releasedOn: RELEASED_ON }));

    expect(() => order.startNextStage()).toThrow("nothing to build");
  });

  it("takes a dated snapshot that stands apart from a later release", () => {
    const order = orderFor(new Plan({ stages: [], releasedOn: RELEASED_ON }));
    const closed = order.close(CLOSED_ON);
    order.release("2026-11-18");

    expect(closed).toMatchObject({
      name: { value: "list-orders" },
      line: { value: "api" },
      plan: { releasedOn: RELEASED_ON },
      closedOn: CLOSED_ON,
      revisions: [{ drawing: "specs/orders/list-orders/spec.md" }],
      andonPulls: [{ names: "orders" }],
    });
    expect(closed.revisions).not.toBe(order.revisions);
    expect(closed.andonPulls).not.toBe(order.andonPulls);
  });
});
