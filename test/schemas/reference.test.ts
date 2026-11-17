import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { project as architectureproject } from "../../factory/engineering.ts";
const { DEFAULTS } = architectureproject;
import { examples as architectureexamples } from "../../factory/quality.ts";
const { examples } = architectureexamples;
import type { Architecture } from "../../factory/shared/domain/schemas/line-types.schema.ts";

/** Spec: `architecture/linting`, the reference module of a workstream and its upstream ones. */
const a: Architecture = {
  platform: DEFAULTS.platform,
  review: DEFAULTS.review,
  ignore: [],
  allowUnmatched: [],
  workstreams: [
    { id: "up", layers: [], checks: [], dependsOn: [] },
    { id: "down", layers: [], checks: [], dependsOn: ["up"] },
  ],
};
const workstreams = (up: string, down: string) => {
  const root = mkdtempSync(join(tmpdir(), "reference-"));
  const write = (ws: string, content: string) => {
    mkdirSync(join(root, ws));
    writeFileSync(
      join(root, ws, `${ws}.examples.md`),
      `# ${ws}\n\n## reference\n\n\`\`\`ts src/seam.ts\n${content}\n\`\`\`\n`,
    );
  };
  write("up", up);
  write("down", down);
  return join(root, "down");
};

describe("a workstream's reference includes its upstream workstreams'", () => {
  it("accepts a seam file copied with identical content", () => {
    expect(() =>
      examples(
        a,
        workstreams("export const s = 1;", "export const s = 1;"),
        "down",
      ),
    ).not.toThrow();
  });
  it("rejects a seam file whose copies differ, naming both example files", () => {
    expect(() =>
      examples(
        a,
        workstreams("export const s = 1;", "export const s = 2;"),
        "down",
      ),
    ).toThrow(
      /down\/down\.examples\.md: reference file src\/seam\.ts differs from its copy in up\/up\.examples\.md|up\/up\.examples\.md: reference file src\/seam\.ts differs from its copy in down\/down\.examples\.md/,
    );
  });
});
