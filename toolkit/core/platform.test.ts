import { describe, expect, it } from "vitest";
import { coreRules } from "../architecture/oxlint.ts";
import { resolveConfig } from "./config.ts";
import { DEFAULTS } from "../architecture/project.ts";
import { node, web } from "./platform.ts";

/** Spec: `implementer`, "A schema picks the platform whose globals are the environment". */
const environment = (platform: typeof node): string =>
  JSON.stringify(coreRules({ packages: [], patterns: [] }, platform, "")["no-restricted-globals"]);

describe("a schema picks the platform whose globals are the environment", () => {
  it.each([
    [node, "process", true],
    [web, "document", true],
    [web, "process", false],
    [node, "document", false],
  ])("on the platform %o the global %s is part of the environment: %s", (platform, global, part) => {
    expect(environment(platform).includes(`"${global}"`)).toBe(part);
  });

  it("a project names a platform by its name", () => {
    expect(resolveConfig(DEFAULTS, { platform: "web" }).platform).toEqual(web);
    expect(() => resolveConfig(DEFAULTS, { platform: "deno" })).toThrow(/no platform is called deno; platforms: node, web/);
  });
});
