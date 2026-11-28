import type { Refusal } from "../../domain/schemas/authorization.schema.ts";
import { PathKind, type ReleasedWorkOrder } from "../../domain/schemas/write-boundary.schema.ts";
import { WriteBoundaryAggregate } from "../../domain/aggregates/write-boundary.aggregate.ts";
import { AuthorizationValueObject } from "../../domain/value-objects/authorization.value-object.ts";
import type { ProtectedAreaValueObject } from "../../domain/value-objects/protected-area.value-object.ts";
import type { WriteRequest } from "../../domain/schemas/write-request.schema.ts";
import type { ReleasedWorkOrderRepositoryInterface } from "../repository-interfaces/released-work-order.repository-interface.ts";
import type { WriteBoundaryRepositoryInterface } from "../repository-interfaces/write-boundary.repository-interface.ts";

export class AuthorizeWriteUseCase {
  private readonly boundary: WriteBoundaryRepositoryInterface;
  private readonly orders: ReleasedWorkOrderRepositoryInterface;

  constructor(boundary: WriteBoundaryRepositoryInterface, orders: ReleasedWorkOrderRepositoryInterface) {
    this.boundary = boundary;
    this.orders = orders;
  }

  async execute(request: WriteRequest): Promise<AuthorizationValueObject> {
    const boundary = WriteBoundaryAggregate.from(await this.boundary.getBoundary());
    const refusals: Refusal[] = [];
    let blockedBy: ProtectedAreaValueObject | undefined;
    let started: ReleasedWorkOrder[] | undefined;

    for (const file of request) {
      const path = this.boundary.findProjectPath(file);
      if (path === null) continue;

      const resolution = boundary.resolve(path);

      if (resolution.kind === PathKind.Harness) {
        blockedBy ??= resolution.area;
        refusals.push(boundary.harnessRefusal(path, resolution.area));

        continue;
      }

      if (resolution.kind === PathKind.Outside) continue;

      started ??= await this.orders.listReleasedWorkOrders();
      const refusal = boundary.productRefusal(path, started, resolution.line);
      if (refusal) refusals.push(refusal);
    }

    return new AuthorizationValueObject({ blockedBy, refusals });
  }
}
