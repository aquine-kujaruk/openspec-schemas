import { join, relative } from "node:path";
import { describe, expect, it } from "vitest";
import { PACKAGE_ROOT } from "../../factory/shared/infrastructure/adapters/paths.adapter.ts";
import { schema as repositoryschema } from "../../factory/engineering.ts";
const { loadDefinition, loadSchema } = repositoryschema;

/**
 * Spec: `repository/build`, "A schema builds through the workstreams of its core and its own".
 * clean-backend names the clean core and adds one workstream of its own, the optional controllers.
 */
describe("clean-backend builds through the clean core", () => {
  it("its workstreams and their topology are the core's and its controllers", async () => {
    const d = await loadDefinition("clean-backend");
    expect(d.core).toBe("clean-core");
    expect(d.workstreams).toEqual([
      "app-domain",
      "infrastructure",
      "adapters",
      "modules",
      "controllers",
    ]);
    expect(d.defaults.workstreams).toEqual({
      "app-domain": { dependsOn: [] },
      infrastructure: { dependsOn: [] },
      adapters: { dependsOn: [] },
      modules: { dependsOn: ["app-domain", "infrastructure", "adapters"] },
      controllers: { dependsOn: [] },
    });
  });

  it("its core's workstreams and its rubric are found in the core's folder, its controllers in its own", async () => {
    const schema = await loadSchema("clean-backend");
    const core = "schemas/shared/cores/clean-core";
    expect(
      Object.fromEntries(
        Object.entries(schema.workstreamDirs).map(([id, dir]) => [
          id,
          relative(PACKAGE_ROOT, dir),
        ]),
      ),
    ).toEqual(
      Object.fromEntries(
        schema.definition.workstreams.map((id) => [
          id,
          id === "controllers" ? "schemas/clean-backend/workstreams/controllers" : join(core, "workstreams", id),
        ]),
      ),
    );
    expect(schema.rubrics.map((r) => relative(PACKAGE_ROOT, r))).toEqual([
      join(core, "review/RUBRIC.md"),
    ]);
  });

  it("its own defaults stay its own", async () => {
    const d = await loadDefinition("clean-backend");
    expect(d.defaults.platform.name).toBe("node");
    expect(d.defaults.frameworks.core.packages).toContain("express");
  });
});

/** Spec: `implementer`, "A schema's own workstreams join its core's in one topology". */
describe("clean-react joins its workstreams to the core's", () => {
  it.each([["modules", "app-domain"]])("%s waits for %s", async (workstream, dependency) => {
    const d = await loadDefinition("clean-react");
    expect(d.defaults.workstreams[workstream]!.dependsOn).toContain(dependency);
  });

  it.each([["app-domain"], ["infrastructure"], ["adapters"], ["modules"]])(
    "react and %s may run at the same time",
    async (other) => {
      const d = await loadDefinition("clean-react");
      expect(d.defaults.workstreams.react!.dependsOn).toEqual([]);
      expect(d.defaults.workstreams[other]!.dependsOn).not.toContain(
        "react",
      );
    },
  );

  it.each([
    ["ui", "react"],
    ["framework", "react"],
    ["domain", "app-domain"],
    ["modules", "modules"],
  ])("layer %s belongs to %s", async (layer, workstream) => {
    const { workstreamDirs } = await loadSchema("clean-react");
    const { existsSync } = await import("node:fs");
    const owners = Object.entries(workstreamDirs).filter(([, dir]) =>
      existsSync(join(dir, `${layer}.rules.ts`)),
    );
    expect(owners.map(([id]) => id)).toEqual([workstream]);
  });
});

/** Spec: `implementer`, "Whole-product checks belong to no workstream". */
describe("the whole-product checks belong to no workstream", () => {
  it.each([["clean-backend"], ["clean-react"]])(
    "in %s, no workstream owns them and the schema carries the core's",
    async (name) => {
      const schema = await loadSchema(name);
      const owned = Object.values(schema.workstreams).flatMap((w) =>
        (w.checks ?? []).map((c) => c.id),
      );
      expect(owned).not.toContain("no-unused-files");
      expect(owned).not.toContain("duplication-below-threshold");
      expect((schema.definition.checks ?? []).map((c) => c.id)).toEqual([
        "no-unused-files",
        "duplication-below-threshold",
      ]);
    },
  );

  it("every workstream of the core owns a layer", async () => {
    const schema = await loadSchema("clean-backend");
    for (const [id, w] of Object.entries(schema.workstreams))
      expect(w.layers(schema.definition.defaults).length, id).toBeGreaterThan(
        0,
      );
  });

  it("clean-react adds its framework as one workstream that owns every layer of it", async () => {
    const d = await loadDefinition("clean-react");
    expect(d.workstreams.at(-1)).toBe("react");
    expect(d.workstreams).not.toContain("react-ui");
    expect(d.workstreams).not.toContain("react-hooks");
    expect(d.spike?.workstream).toBe("react");
  });
});
