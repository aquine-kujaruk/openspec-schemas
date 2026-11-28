import { describe, expect, it } from "vitest";
import { ChangeControlException } from "../../../factory/change-control/domain/exceptions/change-control.exceptions.ts";
import type { ReleasedWorkOrderPort } from "../../../factory/change-control/infrastructure/acl/released-work-order.acl.ts";
import { ReleasedWorkOrderRepositoryImplementation } from "../../../factory/change-control/infrastructure/repository-implementations/released-work-order.repository-implementation.ts";

describe("the released work order repository", () => {
  it("maps the configured line and build capability of each active stage", async () => {
    const started = [
      { name: "build-orders", process: "clean-backend", line: "api", builds: true },
      { name: "record-contracts", process: "spec-plan", line: "contracts", builds: false },
    ];
    const records: ReleasedWorkOrderPort = async () => started;
    const orders = new ReleasedWorkOrderRepositoryImplementation(records);
    expect(await orders.listReleasedWorkOrders()).toEqual(started);
  });

  it("reports a resource failure with its cause", async () => {
    const cause = new Error("unreadable work order");
    const records: ReleasedWorkOrderPort = async () => { throw cause; };
    const orders = new ReleasedWorkOrderRepositoryImplementation(records);
    await expect(orders.listReleasedWorkOrders()).rejects.toMatchObject({
      name: ChangeControlException.name, cause,
    });
  });
});
