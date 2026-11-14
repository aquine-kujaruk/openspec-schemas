import { readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { PACKAGE_ROOT } from "./paths.ts";

/** Decision `toolkit-follows-the-spec-areas`: the command's code is grouped by the area of the specs it implements. */
const TOOLKIT = join(PACKAGE_ROOT, "toolkit");
const AREAS = ["architecture", "core", "flow", "package", "repository"];
const entries = (dir: string) => readdirSync(dir, { withFileTypes: true });

describe("the layout of the toolkit", () => {
  it("holds its entry and one folder per area, nothing else", () => {
    expect(
      entries(TOOLKIT)
        .map((e) => (e.isDirectory() ? `${e.name}/` : e.name))
        .sort(),
    ).toEqual(["cli.ts", ...AREAS.map((a) => `${a}/`)].sort());
  });

  it("keeps each area flat, but for the review inside the architecture", () => {
    const folders = AREAS.flatMap((area) =>
      entries(join(TOOLKIT, area))
        .filter((e) => e.isDirectory())
        .map((e) => `${area}/${e.name}`),
    );
    expect(folders).toEqual(["architecture/review"]);
  });
});
