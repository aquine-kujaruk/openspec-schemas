import { mkdirSync, mkdtempSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, relative } from "node:path";
import { describe, expect, it } from "vitest";
import { PACKAGE_ROOT } from "../core/paths.ts";
import { web } from "../core/platform.ts";
import config from "../../vitest.config.ts";
import { holderNames, loadHolder, projectSchemaName } from "./schema.ts";

/**
 * Spec: `architecture/linting`, "The examples of a layer are verified with the defaults of whoever
 * holds its workstream". A scratch repository laid out as this one, with the clean core, clean-backend
 * naming it, and clean-react naming it and adding a workstream of its own on the web platform.
 */
const repository = (): string => {
  const root = mkdtempSync(join(tmpdir(), "holders-"));
  const link = (path: string) => {
    mkdirSync(dirname(join(root, path)), { recursive: true });
    symlinkSync(join(PACKAGE_ROOT, path), join(root, path));
  };
  ["schemas/spec-plan", "schemas/clean-backend", "schemas/shared/cores/clean-core", "toolkit"].forEach(link);
  const write = (path: string, text: string) => {
    mkdirSync(dirname(join(root, path)), { recursive: true });
    writeFileSync(join(root, path), text);
  };
  write(
    "schemas/clean-react/schema.ts",
    `export default ${JSON.stringify({
      name: "clean-react",
      extends: "spec-plan",
      description: "React on the clean core",
      core: "clean-core",
      workstreams: ["react-ui"],
      defaults: { platform: web, workstreams: { "react-ui": { dependsOn: [] }, modules: { dependsOn: ["react-ui"] } } },
    })};\n`,
  );
  write("schemas/clean-react/workstreams/react-ui/workstream.ts", "export default { layers: () => [] };\n");
  write("schemas/clean-react/workstreams/react-ui/ui.rules.ts", "export {};\n");
  return root;
};

describe("the examples of a layer are verified with the defaults of whoever holds its workstream", () => {
  it("the holders are the core both schemas name and the schema with a workstream of its own", async () => {
    expect(await holderNames(repository())).toEqual(["clean-core", "clean-react"]);
  });

  it.each([
    ["domain", "clean-core", "schemas/shared/cores/clean-core/workstreams/app-domain", "node"],
    ["ui", "clean-react", "schemas/clean-react/workstreams/react-ui", "web"],
  ])("the examples of %s are verified with the defaults of %s", async (layer, holder, folder, platform) => {
    const root = repository();
    const own = await loadHolder(holder, root);
    expect(own.definition.defaults.platform.name).toBe(platform);
    const { existsSync } = await import("node:fs");
    const owning = Object.values(own.workstreamDirs).filter((dir) => existsSync(join(dir, `${layer}.rules.ts`)));
    expect(owning.map((dir) => relative(root, dir))).toEqual([folder]);
  });

  it("the core alone builds through its workstreams, with the stand-in framework its examples veto", async () => {
    const core = await loadHolder("clean-core", repository());
    expect(core.definition.workstreams).toEqual(["app-domain", "infrastructure", "adapters", "modules"]);
    expect(core.definition.defaults.frameworks.core.packages).toContain("express");
    expect(core.definition.defaults.frameworks.core.packages).not.toContain("react");
  });

  it("the schema with a framework joins its workstreams to the core's", async () => {
    const react = await loadHolder("clean-react", repository());
    expect(react.definition.workstreams.at(-1)).toBe("react-ui");
    expect(react.definition.defaults.workstreams.modules!.dependsOn).toEqual(["app-domain", "infrastructure", "adapters", "react-ui"]);
  });

  it("the repository is not asked which schema its tools are composed from", async () => {
    const root = repository();
    await expect(projectSchemaName(root, root)).resolves.toBe("clean-backend");
  });

  it("this repository runs each holder's tests with that holder's defaults", () => {
    const projects = (config.test?.projects ?? []) as Array<{ test: { name: string; include?: string[]; env?: Record<string, string> } }>;
    const core = projects.find((p) => p.test.name === "clean-core")!;
    expect(core.test.env).toEqual({ FACTORY_HOLDER: "clean-core" });
    expect(core.test.include).toContain("schemas/shared/cores/clean-core/workstreams/**/*.test.ts");
  });
});
