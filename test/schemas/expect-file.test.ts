import { describe, expect, it } from "vitest";
import { expectFile as architectureexpectFile } from "../../factory/quality.ts";
const { findingLines, parseFindingLines } = architectureexpectFile;

const LINES = [
  "- src/module/domain/entities/invoice.entity.ts (fallow, oxlint)",
  "- src/module/domain/helpers/format.ts (archunit)",
];

describe("expect block lines", () => {
  it.each([[LINES], [["(no findings)"]]])(
    "round-trips: parse then format gives %j",
    (lines) => {
      expect(findingLines(parseFindingLines(lines, "sample", 10))).toEqual(
        lines,
      );
    },
  );
  it.each([
    ["a line that is no finding", ["- src/a.ts"], "sample:10: not a finding"],
    [
      "an unknown tool",
      [LINES[0], "- src/a.ts (eslint)"],
      "sample:11: unknown tool",
    ],
    ["a repeated path", [LINES[0], LINES[0]], "sample:11: path repeated"],
    [
      "a finding after (no findings)",
      ["(no findings)", LINES[0]],
      "sample:11: finding after",
    ],
    ["a blank line", [LINES[0], ""], "sample:11: not a finding"],
    [
      "a block with nothing recorded",
      [],
      "sample:9: the expect block records nothing",
    ],
  ])("throws naming file and line on %s", (_, lines, message) => {
    expect(() => parseFindingLines(lines, "sample", 10)).toThrow(message);
  });
});
