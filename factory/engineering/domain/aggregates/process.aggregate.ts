import { validateSchema } from "../../../shared/domain/schemas/validation.schema.ts";
import type {
  Options,
  Topology,
  Workstream,
  WorkstreamDeclaration,
} from "../../../shared/domain/schemas/line-types.schema.ts";
import type { ProcessName } from "../../../shared/domain/schemas/process-name.schema.ts";
import { WorkCenterEntity } from "../entities/work-center.entity.ts";
import { EngineeringException } from "../exceptions/engineering.exceptions.ts";
import { ProcessSchema, type ProcessProps } from "../schemas/process.schema.ts";
import type { WorkCenterId } from "../schemas/work-center-id.schema.ts";

/** What the implementer finds on disk: each workstream folder and the `<layer>.rules.ts` files in it. */
export type Folders = Record<string, { layerFiles: string[] }>;

export class ProcessAggregate {
  readonly name!: ProcessName;
  readonly base?: ProcessName;
  readonly description?: string;
  readonly pilot?: WorkCenterId;
  readonly workCenters!: WorkCenterEntity[];

  constructor(props: ProcessProps) {
    validateSchema(this, ProcessSchema, props);
  }

  /** The process of a set of workstreams: each one a work center that waits for what it depends on. */
  static ofTopology(name: ProcessName, topology: Topology): ProcessAggregate {
    return new ProcessAggregate({
      name,
      workCenters: Object.entries(topology).map(
        ([id, { dependsOn }]) => new WorkCenterEntity({ id, parts: [], waitsFor: dependsOn }),
      ),
    });
  }

  /**
   * Joins what each folder declares (`workstream.ts`) with the configured topology. Fails, naming the
   * workstreams involved, when the configuration and the folders disagree, when a dependency names no
   * workstream, when the dependencies form a cycle, or when a layer has no owner or two. The result
   * keeps the order of `declarations`, so composing the tools does not depend on the topology.
   */
  static loadWorkstreams(
    declarations: Record<string, WorkstreamDeclaration>,
    folders: Folders,
    topology: Topology,
    o: Options,
  ): Workstream[] {
    const errors: string[] = [];
    for (const id of Object.keys(folders)) {
      if (!declarations[id]) errors.push(`workstream ${id}: its folder has no registered workstream.ts`);
      if (!topology[id]) errors.push(`workstream ${id}: the configuration's workstreams section does not list it`);
    }
    for (const id of Object.keys(topology))
      if (!folders[id]) errors.push(`workstream ${id}: configured, but it has no folder`);
    const unknown = Object.entries(topology).flatMap(([id, { dependsOn }]) =>
      dependsOn.filter((d) => !topology[d]).map((d) => `workstream ${id} depends on ${d}, which is no workstream`),
    );
    errors.push(...unknown);

    const workstreams: Workstream[] = Object.entries(declarations).map(([id, d]) => ({
      id,
      layers: d.layers(o),
      checks: d.checks ?? [],
      dependsOn: topology[id]?.dependsOn ?? [],
    }));

    const owners = new Map<string, string[]>();
    for (const w of workstreams)
      for (const l of w.layers) owners.set(l.name, [...(owners.get(l.name) ?? []), w.id]);
    for (const [layer, ids] of owners)
      if (ids.length > 1) errors.push(`layer ${layer}: claimed by ${ids.join(", ")}`);
    for (const [id, { layerFiles }] of Object.entries(folders))
      for (const layer of layerFiles)
        if (!owners.has(layer)) errors.push(`layer ${layer}: ${id}/${layer}.rules.ts is owned by no workstream`);

    const cycle = unknown.length ? undefined : ProcessAggregate.ofTopology("workstreams", topology).cycle();
    if (cycle) errors.push(`workstream cycle: ${cycle.join(" → ")}`);
    if (errors.length) throw new EngineeringException(`the implementer does not load:\n  ${errors.join("\n  ")}`);
    return workstreams;
  }

  /** The process the workstreams form, in the order they were declared. */
  private static ofWorkstreams(ws: Workstream[]): ProcessAggregate {
    return ProcessAggregate.ofTopology(
      "workstreams",
      Object.fromEntries(ws.map((w) => [w.id, { dependsOn: w.dependsOn }])),
    );
  }

  /** Every workstream `id` waits for, directly or through others. */
  static upstream(ws: Workstream[], id: string): string[] {
    return ProcessAggregate.ofWorkstreams(ws).prerequisites(id).map((center) => center.id);
  }

  /** The order to run them in: a workstream after every one it depends on. */
  static runOrder(ws: Workstream[]): string[] {
    return ProcessAggregate.ofWorkstreams(ws).executionOrder().map((center) => center.id);
  }

  /** Two workstreams may run at the same time when neither waits for the other. */
  static mayRunTogether(ws: Workstream[], a: string, b: string): boolean {
    return ProcessAggregate.ofWorkstreams(ws).mayRunTogether(a, b);
  }

  /** The workstream that owns a layer. */
  static ownerOf(ws: Workstream[], layer: string): Workstream | undefined {
    return ws.find((w) => w.layers.some((l) => l.name === layer));
  }

  /** A workstream and every one upstream of it: what its check and its reference cover. */
  static withUpstream(ws: Workstream[], id: string): Workstream[] {
    const ids = new Set([id, ...ProcessAggregate.upstream(ws, id)]);
    return ws.filter((w) => ids.has(w.id));
  }

  /** The first cycle among the work centers, as the ids that close it, or none. */
  cycle(): string[] | undefined {
    const done = new Set<string>();
    const visit = (center: WorkCenterEntity, path: string[]): string[] | undefined => {
      if (done.has(center.id)) return undefined;
      const at = path.indexOf(center.id);
      if (at !== -1) return [...path.slice(at), center.id];
      for (const id of center.waitsFor) {
        const found = visit(this.workCenter(id), [...path, center.id]);
        if (found) return found;
      }
      done.add(center.id);
      return undefined;
    };
    for (const center of this.workCenters) {
      const found = visit(center, []);
      if (found) return found;
    }
    return undefined;
  }

  executionOrder(): WorkCenterEntity[] {
    const cycle = this.cycle();
    if (cycle) throw new EngineeringException(`Work centers form a cycle at ${cycle[0]}`);
    const ordered = new Set<WorkCenterEntity>();
    const visit = (center: WorkCenterEntity): void => {
      if (ordered.has(center)) return;
      for (const id of center.waitsFor) visit(this.workCenter(id));
      ordered.add(center);
    };
    for (const center of this.workCenters) visit(center);
    return [...ordered];
  }

  prerequisites(id: WorkCenterId): WorkCenterEntity[] {
    const upstream = new Set<WorkCenterEntity>();
    const collect = (center: WorkCenterEntity): void => {
      for (const dependencyId of center.waitsFor) {
        const dependency = this.workCenter(dependencyId);
        if (upstream.has(dependency)) continue;
        upstream.add(dependency);
        collect(dependency);
      }
    };
    collect(this.workCenter(id));
    return this.executionOrder().filter((center) => upstream.has(center));
  }

  mayRunTogether(left: WorkCenterId, right: WorkCenterId): boolean {
    const earlier = this.workCenter(left);
    const later = this.workCenter(right);
    return !this.prerequisites(left).includes(later) && !this.prerequisites(right).includes(earlier);
  }

  private workCenter(id: WorkCenterId): WorkCenterEntity {
    const center = this.workCenters.find((current) => current.id === id);
    if (!center) throw new EngineeringException(`Unknown work center ${id}`);
    return center;
  }
}
