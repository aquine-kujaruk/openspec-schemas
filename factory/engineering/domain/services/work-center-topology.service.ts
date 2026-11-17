import type {
  Options,
  Topology,
  Workstream,
  WorkstreamDeclaration,
} from "../../../shared/domain/schemas/line-types.schema.ts";
import { EngineeringException } from "../exceptions/engineering.exceptions.ts";

/** What the implementer finds on disk: each workstream folder and the `<layer>.rules.ts` files in it. */
export type Folders = Record<string, { layerFiles: string[] }>;

export class WorkCenterTopologyService {
  /**
   * Joins what each folder declares (`workstream.ts`) with the configured topology. Fails, naming the
   * workstreams involved, when the configuration and the folders disagree, when a dependency names no
   * workstream, when the dependencies form a cycle, or when a layer has no owner or two. The result
   * keeps the order of `declarations`, so composing the tools does not depend on the topology.
   */
  static loadWorkstreams = (
    declarations: Record<string, WorkstreamDeclaration>,
    folders: Folders,
    topology: Topology,
    o: Options,
  ): Workstream[] => {
    const errors: string[] = [];
    for (const id of Object.keys(folders)) {
      if (!declarations[id])
        errors.push(
          `workstream ${id}: its folder has no registered workstream.ts`,
        );
      if (!topology[id])
        errors.push(
          `workstream ${id}: the configuration's workstreams section does not list it`,
        );
    }
    for (const id of Object.keys(topology))
      if (!folders[id])
        errors.push(`workstream ${id}: configured, but it has no folder`);
    for (const [id, { dependsOn }] of Object.entries(topology))
      for (const d of dependsOn)
        if (!topology[d])
          errors.push(`workstream ${id} depends on ${d}, which is no workstream`);

    const workstreams: Workstream[] = Object.entries(declarations).map(
      ([id, d]) => ({
        id,
        layers: d.layers(o),
        checks: d.checks ?? [],
        dependsOn: topology[id]?.dependsOn ?? [],
      }),
    );

    const owners = new Map<string, string[]>();
    for (const w of workstreams)
      for (const l of w.layers)
        owners.set(l.name, [...(owners.get(l.name) ?? []), w.id]);
    for (const [layer, ids] of owners)
      if (ids.length > 1)
        errors.push(`layer ${layer}: claimed by ${ids.join(", ")}`);
    for (const [id, { layerFiles }] of Object.entries(folders))
      for (const layer of layerFiles)
        if (!owners.has(layer))
          errors.push(
            `layer ${layer}: ${id}/${layer}.rules.ts is owned by no workstream`,
          );

    const cycle = WorkCenterTopologyService.findCycle(topology);
    if (cycle) errors.push(`workstream cycle: ${cycle.join(" → ")}`);
    if (errors.length)
      throw new EngineeringException(`the implementer does not load:\n  ${errors.join("\n  ")}`);
    return workstreams;
  };

  private static findCycle = (topology: Topology): string[] | undefined => {
    const state = new Map<string, "visiting" | "done">();
    const visit = (id: string, path: string[]): string[] | undefined => {
      if (state.get(id) === "done") return undefined;
      if (state.get(id) === "visiting")
        return [...path.slice(path.indexOf(id)), id];
      state.set(id, "visiting");
      for (const d of topology[id]?.dependsOn ?? []) {
        const found = visit(d, [...path, id]);
        if (found) return found;
      }
      state.set(id, "done");
      return undefined;
    };
    for (const id of Object.keys(topology)) {
      const found = visit(id, []);
      if (found) return found;
    }
    return undefined;
  };

  /** Every workstream `id` waits for, directly or through others. */
  static upstream = (ws: Workstream[], id: string): string[] => {
    const byId = new Map(ws.map((w) => [w.id, w]));
    const seen = new Set<string>();
    const walk = (i: string) => {
      for (const d of byId.get(i)?.dependsOn ?? [])
        if (!seen.has(d)) {
          seen.add(d);
          walk(d);
        }
    };
    walk(id);
    return [...seen];
  };

  /** The order to run them in: a workstream after every one it depends on. */
  static runOrder = (ws: Workstream[]): string[] => {
    const done: string[] = [];
    const place = (w: Workstream) => {
      if (done.includes(w.id)) return;
      for (const d of w.dependsOn) place(ws.find((x) => x.id === d)!);
      done.push(w.id);
    };
    ws.forEach(place);
    return done;
  };

  /** Two workstreams may run at the same time when neither waits for the other. */
  static mayRunTogether = (
    ws: Workstream[],
    a: string,
    b: string,
  ): boolean => !WorkCenterTopologyService.upstream(ws, a).includes(b) && !WorkCenterTopologyService.upstream(ws, b).includes(a);

  /** The workstream that owns a layer. */
  static ownerOf = (
    ws: Workstream[],
    layer: string,
  ): Workstream | undefined =>
    ws.find((w) => w.layers.some((l) => l.name === layer));

  /** A workstream and every one upstream of it: what its check and its reference cover. */
  static withUpstream = (ws: Workstream[], id: string): Workstream[] => {
    const ids = new Set([id, ...WorkCenterTopologyService.upstream(ws, id)]);
    return ws.filter((w) => ids.has(w.id));
  };
}
