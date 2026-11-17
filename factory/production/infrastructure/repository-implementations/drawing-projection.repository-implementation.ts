import type { DrawingProjectionRepositoryInterface } from "../../application/repository-interfaces/drawing-projection.repository-interface.ts";
import type { DrawingProjectionAcl } from "../acl/drawing-projection.acl.ts";
import type { WorkOrderRecordAcl } from "../acl/work-order-record.acl.ts";

export class DrawingProjectionRepositoryImplementation implements DrawingProjectionRepositoryInterface {
  private readonly orders: WorkOrderRecordAcl;
  private readonly drawings: DrawingProjectionAcl;

  constructor(orders: WorkOrderRecordAcl, drawings: DrawingProjectionAcl) {
    this.orders = orders;
    this.drawings = drawings;
  }

  listWorkOrders(root: string) {
    return this.orders.activeChanges(root).flatMap((name) => this.orders.readChange(root, name) ?? []);
  }

  mergeDrawings(root: string, changes: string[]) { return this.drawings.mergeDrawings(root, changes); }
}
