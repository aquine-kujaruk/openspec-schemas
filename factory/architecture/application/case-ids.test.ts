import { readFileSync } from "node:fs";
import { basename, join, relative } from "node:path";
import { afterAll, describe, expect, it } from "vitest";
import {
  ARCHITECTURE_SPECS,
  hasLayerSpecs,
  PACKAGE_ROOT,
  SKIPPED_WITHOUT_SPECS,
} from "../../shared/infrastructure/adapters/paths.ts";
import { project as architectureproject } from "../../architecture.ts";
const { EXAMPLE_FILES } = architectureproject;
import { exampleFile as architectureexampleFile } from "../../architecture.ts";
const { parseExampleFile } = architectureexampleFile;
import { merged as flowmerged } from "../../flow.ts";
const { specsAsReadyChangesLeaveThem } = flowmerged;

/** The layer specs as ready changes leave them, so a layer a change adds is held to its spec before the archive. */
const specs = await specsAsReadyChangesLeaveThem(PACKAGE_ROOT);
afterAll(specs.dispose);

/** `(rule, case)` pairs of the Examples rows `| <case> | <rule> |` in a layer spec. */
const rowsOf = (spec: string): string[] => {
  const pairs: string[] = [];
  let header: string[] | undefined;
  for (const line of readFileSync(spec, "utf8").split("\n")) {
    const cells = /^\s*\|(.*)\|\s*$/
      .exec(line)?.[1]
      .split("|")
      .map((c) => c.trim());
    if (!cells) header = undefined;
    else if (!header) header = cells;
    else if (
      header[0] === "example" &&
      header[1] === "rule" &&
      !/^-+$/.test(cells[0])
    )
      pairs.push(`${cells[1]} · ${cells[0]}`);
  }
  return pairs;
};

/** A case is a row and a row is a case: neither can be recorded or generated without the other. */
describe.skipIf(!hasLayerSpecs())(
  hasLayerSpecs() ? "case ids" : `case ids (${SKIPPED_WITHOUT_SPECS})`,
  () => {
    for (const path of EXAMPLE_FILES) {
      const examples = relative(PACKAGE_ROOT, path);
      const layer = basename(path, ".examples.md");
      const spec = `${ARCHITECTURE_SPECS}/${layer}/spec.md`;
      const cases = [...parseExampleFile(path).rules].flatMap(([rule, c]) =>
        [...c.keys()].map((name) => `${rule} · ${name}`),
      );
      const rows = hasLayerSpecs() ? rowsOf(join(specs.base, spec)) : [];
      it(`${layer}: every case in ${examples} is a row of ${spec}`, () => {
        expect(
          cases.filter((c) => !rows.includes(c)),
          `cases missing in ${spec}`,
        ).toEqual([]);
      });
      it(`${layer}: every row of ${spec} is a case in ${examples}`, () => {
        expect(
          rows.filter((r) => !cases.includes(r)),
          `rows missing in ${examples}`,
        ).toEqual([]);
      });
    }
  },
);
