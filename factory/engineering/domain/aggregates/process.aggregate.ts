import { validateSchema } from "../../../shared/domain/schemas/validation.schema.ts";
import { ProcessSchema, type ProcessProps } from "../schemas/process.schema.ts";
import type { ProcessName } from "../../../shared/domain/value-objects/process-name.value-object.ts";
import type { WorkCenter } from "../entities/work-center.entity.ts";
import { EngineeringException } from "../exceptions/engineering.exceptions.ts";
import type { WorkCenterId } from "../value-objects/work-center-id.value-object.ts";

export class Process {
  readonly name!: ProcessName;
  readonly base?: ProcessName;
  readonly description?: string;
  readonly pilot?: WorkCenterId;
  readonly workCenters!: WorkCenter[];

  constructor(props: ProcessProps) {
    validateSchema(this, ProcessSchema, props);
  }

  executionOrder(): WorkCenter[] {
    const ordered = new Set<WorkCenter>();
    const visiting = new Set<WorkCenter>();
    const visit = (center: WorkCenter): void => {
      if (ordered.has(center)) return;
      if (visiting.has(center)) {
        throw new EngineeringException(`Work centers form a cycle at ${center.id.value}`);
      }
      visiting.add(center);
      for (const id of center.waitsFor) visit(this.workCenter(id));
      visiting.delete(center);
      ordered.add(center);
    };
    for (const center of this.workCenters) visit(center);
    return [...ordered];
  }

  prerequisites(id: WorkCenterId): WorkCenter[] {
    const selected = this.workCenter(id);
    const upstream = new Set<WorkCenter>();
    const collect = (center: WorkCenter): void => {
      for (const id of center.waitsFor) {
        const dependency = this.workCenter(id);
        if (upstream.has(dependency)) continue;
        upstream.add(dependency);
        collect(dependency);
      }
    };
    collect(selected);
    return this.executionOrder().filter((center) => upstream.has(center));
  }

  mayRunTogether(left: WorkCenterId, right: WorkCenterId): boolean {
    const earlier = this.workCenter(left);
    const later = this.workCenter(right);
    return !this.prerequisites(left).includes(later) &&
      !this.prerequisites(right).includes(earlier);
  }

  private workCenter(id: WorkCenterId): WorkCenter {
    const center = this.workCenters.find((current) => current.id.value === id.value);
    if (!center) throw new EngineeringException(`Unknown work center ${id.value}`);
    return center;
  }
}
