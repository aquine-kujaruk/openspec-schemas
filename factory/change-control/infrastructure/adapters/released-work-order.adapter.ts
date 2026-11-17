import type { ReleasedWorkOrderAcl, ReleasedWorkOrderRecord } from "../acl/released-work-order.acl.ts";

export class ReleasedWorkOrderAdapter implements ReleasedWorkOrderAcl {
  private readonly active: () => Promise<ReleasedWorkOrderRecord[]>;

  constructor(active: () => Promise<ReleasedWorkOrderRecord[]>) {
    this.active = active;
  }

  readStarted(): Promise<ReleasedWorkOrderRecord[]> {
    return this.active();
  }
}
