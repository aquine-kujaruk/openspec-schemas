import { describe, expect, it } from "vitest";
import type { WorkOrderAcl } from "../../../factory/production/infrastructure/acl/work-order.acl.ts";
import { WorkOrderRepositoryImplementation } from "../../../factory/production/infrastructure/repository-implementations/work-order.repository-implementation.ts";


describe("work order repository", () => {
  it("maps the document without replacing it when the order is released", async () => {
    let released: string | undefined;
    const resource: WorkOrderAcl = {
      async listOrders() { return ["ship"]; },
      async readOrder(name) { return {
        name,
        process: "clean-backend",
        line: "server",
        plan: "# Ship\n\n## Phases\n\n### Phase 1: Wire\n\n- [ ] modules: compose\n",
        revisions: [{ drawing: "shipping/send", document: "## ADDED Requirements\n\n### Requirement: Ship safely\n" }],
        andon: [{ from: "the person", names: "phase 1", says: "check the label" }],
      }; },
      async writeRelease(_name, day) { released = day; },
    };
    const orders = new WorkOrderRepositoryImplementation(resource);
    const order = (await orders.findWorkOrder("ship"))!;
    expect(order.process).toBe("clean-backend");
    expect(order.revisions[0]?.requirements[0]?.name).toBe("Ship safely");
    expect(order.andonPulls[0]?.says).toBe("check the label");
    order.release("2026-11-17");
    expect(order.startNextStage().operations[0]?.workCenter).toBe("modules");
    await orders.saveWorkOrder(order);
    expect(released).toBe("2026-11-17");
  });
});
