import { NotValidatable } from "../../domain/exceptions/work-order.exceptions.ts";
import type { DrawingProjection, DrawingProjectionRepositoryInterface } from "../repository-interfaces/drawing-projection.repository-interface.ts";
import type { AssessWorkOrderUseCase } from "./assess-work-order.use-case.ts";

export class ProjectDrawingsUseCase {
  private readonly drawings: DrawingProjectionRepositoryInterface;
  private readonly assess: AssessWorkOrderUseCase;

  constructor(drawings: DrawingProjectionRepositoryInterface, assess: AssessWorkOrderUseCase) {
    this.drawings = drawings;
    this.assess = assess;
  }

  /** Projects the drawings as ready work orders with revisions will leave them, oldest first. */
  async execute(root: string): Promise<DrawingProjection | undefined> {
    const found: Array<{ name: string; created: string }> = [];
    for (const change of this.drawings.listWorkOrders(root)) {
      if (!change.deltaSpecs.length) continue;
      const { name } = change;
      try {
        if ((await this.assess.execute(root, name)).ready)
          found.push({ name, created: change.created ?? "" });
      } catch (e) {
        if (!(e instanceof NotValidatable)) throw e;
      }
    }
    const ready = found
      .sort(
        (a, b) =>
          a.created.localeCompare(b.created) || a.name.localeCompare(b.name),
      )
      .map((c) => c.name);
    return ready.length ? this.drawings.mergeDrawings(root, ready) : undefined;
  }
}
