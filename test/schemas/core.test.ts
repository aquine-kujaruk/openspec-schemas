import { join, relative } from "node:path";
import { describe, expect, it } from "vitest";
import { PACKAGE_ROOT } from "../../factory/shared/infrastructure/adapters/paths.adapter.ts";
import { schema as repositoryschema } from "../../factory/engineering.ts";
const { loadDefinition, loadSchema } = repositoryschema;

/**
 * Spec: `repository/build`, "A schema builds through the workstreams of its core and its own".
 * clean-backend names the clean core and adds nothing: it builds as it did when it held the
 * workstreams itself.
 */
describe("clean-backend builds through the clean core", () => {
  it("its workstreams and their topology are the core's", async () => {
    const d = await loadDefinition("clean-backend");
    expect(d.core).toBe("clean-core");
    expect(d.workstreams).toEqual([
      "app-domain",
      "infrastructure",
      "adapters",
      "modules",
    ]);
    expect(d.defaults.workstreams).toEqual({
      "app-domain": { dependsOn: [] },
      infrastructure: { dependsOn: [] },
      adapters: { dependsOn: [] },
      modules: { dependsOn: ["app-domain", "infrastructure", "adapters"] },
    });
  });

  it("its workstreams and its rubric are found in the core's folder", async () => {
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
          join(core, "workstreams", id),
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
  it.each([
    ["react-hooks", "react-ui"],
    ["modules", "app-domain"],
  ])("%s waits for %s", async (workstream, dependency) => {
    const d = await loadDefinition("clean-react");
    expect(d.defaults.workstreams[workstream]!.dependsOn).toContain(dependency);
  });

  it.each([["app-domain"], ["infrastructure"], ["adapters"]])(
    "react-ui and %s may run at the same time",
    async (other) => {
      const d = await loadDefinition("clean-react");
      expect(d.defaults.workstreams["react-ui"]!.dependsOn).toEqual([]);
      expect(d.defaults.workstreams[other]!.dependsOn).not.toContain(
        "react-ui",
      );
    },
  );

  it.each([
    ["ui", "react-ui"],
    ["framework", "react-hooks"],
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

  it("react-hooks and modules may run at the same time in clean-react", async () => {
    const d = await loadDefinition("clean-react");
    expect(d.defaults.workstreams["react-hooks"]!.dependsOn).not.toContain(
      "modules",
    );
    expect(d.defaults.workstreams.modules!.dependsOn).not.toContain(
      "react-hooks",
    );
  });
});
