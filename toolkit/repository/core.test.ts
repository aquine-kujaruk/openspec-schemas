import { join, relative } from "node:path";
import { describe, expect, it } from "vitest";
import { PACKAGE_ROOT } from "../core/paths.ts";
import { loadDefinition, loadSchema } from "./schema.ts";

/**
 * Spec: `repository/build`, "A schema builds through the workstreams of its core and its own".
 * clean-backend names the clean core and adds nothing: it builds as it did when it held the
 * workstreams itself.
 */
describe("clean-backend builds through the clean core", () => {
  it("its workstreams and their topology are the core's", async () => {
    const d = await loadDefinition("clean-backend");
    expect(d.core).toBe("clean-core");
    expect(d.workstreams).toEqual(["app-domain", "infrastructure", "adapters", "modules", "integrate"]);
    expect(d.defaults.workstreams).toEqual({
      "app-domain": { dependsOn: [] },
      infrastructure: { dependsOn: [] },
      adapters: { dependsOn: [] },
      modules: { dependsOn: ["app-domain", "infrastructure", "adapters"] },
      integrate: { dependsOn: ["modules"] },
    });
  });

  it("its workstreams and its rubric are found in the core's folder", async () => {
    const schema = await loadSchema("clean-backend");
    const core = "schemas/shared/cores/clean-core";
    expect(
      Object.fromEntries(Object.entries(schema.workstreamDirs).map(([id, dir]) => [id, relative(PACKAGE_ROOT, dir)])),
    ).toEqual(Object.fromEntries(schema.definition.workstreams.map((id) => [id, join(core, "workstreams", id)])));
    expect(relative(PACKAGE_ROOT, schema.rubric!)).toBe(join(core, "review/RUBRIC.md"));
  });

  it("its own defaults stay its own", async () => {
    const d = await loadDefinition("clean-backend");
    expect(d.defaults.platform.name).toBe("node");
    expect(d.defaults.frameworks.core.packages).toContain("express");
  });
});
