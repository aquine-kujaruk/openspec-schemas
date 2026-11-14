import { describe, expect, it } from "vitest";
import { DEFAULTS } from "./project.ts";
import { type Folders, loadWorkstreams, mayRunTogether, ownerOf, runOrder } from "./graph.ts";
import type { Layer, Topology, WorkstreamDeclaration } from "./types.ts";

/** Spec: `implementer`, requirements on declaring workstreams, their order and layer ownership. */
const layer = (name: string): Layer => ({ name });
const declare = (...layers: string[]): WorkstreamDeclaration => ({
  layers: () => layers.map(layer),
});
const DECLARATIONS = {
  "app-domain": declare("acceptance", "application", "domain"),
  infrastructure: declare("infrastructure"),
  adapters: declare("adapters"),
  "clean-architecture": declare("modules"),
  integrate: declare(),
};
const folders = (d: Record<string, WorkstreamDeclaration> = DECLARATIONS): Folders =>
  Object.fromEntries(
    Object.entries(d).map(([id, w]) => [id, { layerFiles: w.layers(DEFAULTS).map((l) => l.name) }]),
  );
const load = (topology: Topology, d = DECLARATIONS, f = folders(d)) =>
  loadWorkstreams(d, f, topology, DEFAULTS);
const SEQUENCE: Topology = {
  "app-domain": { dependsOn: [] },
  infrastructure: { dependsOn: ["app-domain"] },
  adapters: { dependsOn: ["infrastructure"] },
  "clean-architecture": { dependsOn: ["adapters"] },
  integrate: { dependsOn: ["clean-architecture"] },
};

describe("the implementer declares its workstreams and their dependencies", () => {
  it.each([["integrate", "clean-architecure"]])("a dependency of %s on the unknown workstream %s is rejected", (workstream, dependency) => {
    const topology = { ...DEFAULTS.workstreams, [workstream]: { dependsOn: [dependency] } };
    expect(() => load(topology)).toThrow(new RegExp(`${workstream} depends on ${dependency}`));
  });
  it.each([["adapters"]])(
    "the folder %s missing from the configuration is rejected",
    (workstream) => {
      const { [workstream]: _gone, ...topology } = DEFAULTS.workstreams;
      expect(() => load(topology)).toThrow(
        new RegExp(`workstream ${workstream}: the configuration`),
      );
    },
  );
  it("a configured workstream without a folder is rejected", () => {
    const topology = { ...DEFAULTS.workstreams, e2e: { dependsOn: [] } };
    expect(() => load(topology)).toThrow(/workstream e2e: configured, but it has no folder/);
  });
  it.each([
    ["clean-architecture", "integrate", "clean-architecture → integrate → clean-architecture"],
  ])("%s and %s depending on each other are rejected", (workstream, dependency, cycle) => {
    const topology = {
      ...DEFAULTS.workstreams,
      [workstream]: { dependsOn: [dependency] },
      [dependency]: { dependsOn: [workstream] },
    };
    expect(() => load(topology)).toThrow(`workstream cycle: ${cycle}`);
  });
});

describe("workstreams run in dependency order", () => {
  const before = (order: string[], a: string, b: string) => order.indexOf(a) < order.indexOf(b);
  it.each([
    ["clean-architecture", "app-domain"],
    ["clean-architecture", "infrastructure"],
    ["clean-architecture", "adapters"],
    ["integrate", "clean-architecture"],
  ])("by default %s waits for %s", (workstream, dependency) => {
    const ws = load(DEFAULTS.workstreams);
    expect(before(runOrder(ws), dependency, workstream)).toBe(true);
    expect(mayRunTogether(ws, workstream, dependency)).toBe(false);
  });
  it.each([
    ["app-domain", "infrastructure"],
    ["infrastructure", "adapters"],
  ])("by default %s and %s may run at the same time", (workstream, other) => {
    expect(mayRunTogether(load(DEFAULTS.workstreams), workstream, other)).toBe(true);
  });
  it.each([
    ["infrastructure", "app-domain"],
    ["adapters", "infrastructure"],
  ])("in sequence %s waits for %s", (workstream, dependency) => {
    const ws = load(SEQUENCE);
    expect(before(runOrder(ws), dependency, workstream)).toBe(true);
    expect(mayRunTogether(ws, workstream, dependency)).toBe(false);
  });
});

describe("every layer belongs to exactly one workstream", () => {
  it("a layer claimed by two workstreams is rejected", () => {
    const d = { ...DECLARATIONS, infrastructure: declare("infrastructure", "domain") };
    expect(() => load(DEFAULTS.workstreams, d)).toThrow(
      /layer domain: claimed by app-domain, infrastructure/,
    );
  });
  it("a layer file no workstream owns is rejected", () => {
    const d = { ...DECLARATIONS, "clean-architecture": declare() };
    const f = { ...folders(d), "clean-architecture": { layerFiles: ["modules"] } };
    expect(() => load(DEFAULTS.workstreams, d, f)).toThrow(
      /layer modules: .* owned by no workstream/,
    );
  });
  it.each([
    ["acceptance", "app-domain"],
    ["application", "app-domain"],
    ["domain", "app-domain"],
    ["infrastructure", "infrastructure"],
    ["adapters", "adapters"],
    ["modules", "clean-architecture"],
  ])("layer %s belongs to %s", (name, workstream) => {
    expect(ownerOf(load(DEFAULTS.workstreams), name)?.id).toBe(workstream);
  });
});
