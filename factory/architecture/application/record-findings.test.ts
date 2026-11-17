import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import type { Recorded } from "../domain/example-file.ts";
import { exampleFile as architectureexampleFile } from "../../architecture.ts";
const { parseExampleText, recordFindings } = architectureexampleFile;
import { project as architectureproject } from "../../architecture.ts";
const { EXAMPLE_FILES } = architectureproject;

/** The text without its `expect` blocks and the blank lines right before each. */
const strip = (text: string): string => {
  const out: string[] = [];
  let ticks: string | undefined;
  let dropping = false;
  for (const line of text.split("\n")) {
    if (ticks) {
      if (line.startsWith(ticks) && /^`+\s*$/.test(line)) ticks = undefined;
      if (!dropping) out.push(line);
      continue;
    }
    const fence = /^(`{3,})(\S*)/.exec(line);
    dropping = fence?.[2] === "expect";
    if (fence) ticks = fence[1];
    if (dropping) while (out.at(-1) === "") out.pop();
    else out.push(line);
  }
  return out.join("\n");
};

/** Made-up findings for every case of a file; `turn` changes which cases record a file. */
const madeUp = (text: string, turn: number): Recorded =>
  new Map(
    [...parseExampleText(text, "made-up").rules].map(([rule, cases]) => [
      rule,
      new Map(
        [...cases.keys()].map((name, i) => [
          name,
          (i + turn) % 2
            ? new Map()
            : new Map([
                [`src/${rule}/${name}.ts`, new Set(["archunit" as const])],
              ]),
        ]),
      ),
    ]),
  );

const recordedIn = (text: string): Recorded =>
  new Map(
    [...parseExampleText(text, "written").rules].map(([rule, cases]) => [
      rule,
      new Map([...cases].map(([name, c]) => [name, c.expected!])),
    ]),
  );

describe("recording findings in an example file", () => {
  it("appends a block after the last non-blank line of a case without one", () => {
    const text =
      "## no-environment\n\n### a\n\n```ts src/a.ts\nx\n```\nA note.\n\n### b\n";
    const recorded: Recorded = new Map([
      ["no-environment", new Map([["a", new Map()]])],
    ]);
    expect(recordFindings(text, "sample", recorded)).toBe(
      "## no-environment\n\n### a\n\n```ts src/a.ts\nx\n```\nA note.\n\n```expect\n(no findings)\n```\n\n### b\n",
    );
  });

  for (const path of EXAMPLE_FILES) {
    it(`${path}: only the expect blocks change, appended or replaced`, () => {
      const text = readFileSync(path, "utf8");
      const bare = strip(text);
      for (const [before, turn] of [
        [bare, 0],
        [text, 1],
      ] as const) {
        const first = recordFindings(before, path, madeUp(before, turn));
        expect(strip(first)).toBe(bare);
        expect(recordedIn(first)).toEqual(madeUp(before, turn));
        const second = recordFindings(first, path, madeUp(before, turn + 1));
        expect(strip(second)).toBe(bare);
        expect(recordedIn(second)).toEqual(madeUp(before, turn + 1));
      }
    });
  }
});
