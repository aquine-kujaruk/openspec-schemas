import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { PACKAGE_ROOT } from "../../core/paths.ts";
import { loadSchema } from "../../repository/schema.ts";
import { checkGeneric, loadRubric, packagesOf, parseRubric, readRubric } from "./rubric.ts";

const RUBRIC = `# Doc

### Reviewer rubric (not lintable)

Product vocabulary (each word is matched at the start of a word): \`payment\`, \`cart\`.

| ID | Rule | Question (yes/no) | Layers |
| --- | --- | --- | --- |
| S09 | A domain name says what happens in the business. Never the technology | Does this file name a technology, library or provider? | domain, application |
| S11 | An aggregate exists only by need | Does an aggregate exist by obligation? | across files |
| S14 | An emergent object moves to shared | Is an emergent object kept in one module? | across files |
`;

describe("rubric", () => {
  it("parses every row into id, title, question, folders and cross-file flag", () => {
    const { rows, product } = parseRubric(RUBRIC);
    expect(product).toEqual(["payment", "cart"]);
    expect(rows).toEqual([
      {
        id: "S09",
        title: "A domain name says what happens in the business",
        question: "Does this file name a technology, library or provider?",
        folders: ["domain", "application"],
        crossFile: false,
      },
      {
        id: "S11",
        title: "An aggregate exists only by need",
        question: "Does an aggregate exist by obligation?",
        folders: [],
        crossFile: true,
      },
      {
        id: "S14",
        title: "An emergent object moves to shared",
        question: "Is an emergent object kept in one module?",
        folders: [],
        crossFile: true,
      },
    ]);
  });
  it("reads package names from dependencies and devDependencies", () => {
    expect(
      packagesOf(JSON.stringify({ dependencies: { pg: "1" }, devDependencies: { zod: "2" } })),
    ).toEqual(["pg", "zod"]);
  });
  it.each([
    ["names a technology, library or provider", undefined],
    ["does this domain file import pg directly", "names `pg`"],
    ["is the state kept through a pg-pool connection", "names `pg`, `pg-pool`"],
    ["does this file name the payment provider of the product", "names `payment`"],
    ["does it move a pgroup of cards", "names `pg`"],
    ["is the cartography loaded", "names `cart`"],
  ])("checks genericity of %j → %j", (question, reason) => {
    expect(
      checkGeneric(question, {
        packages: ["pg", "@scope/pg-pool"],
        product: ["payment", "cart"],
      }),
    ).toBe(reason);
  });
  it("rejects a row whose question names a package and accepts the rest", () => {
    const rows = loadRubric(RUBRIC.replace("library or provider?", "library such as zod?"), [
      "zod",
    ]);
    expect(rows.map((r) => [r.id, r.verdict, r.reason])).toEqual([
      ["S09", "rejected", "names `zod`"],
      ["S11", "accepted", undefined],
      ["S14", "accepted", undefined],
    ]);
  });
  it("rejects a row without a question", () => {
    const rows = loadRubric(RUBRIC.replace("Does an aggregate exist by obligation?", ""), []);
    expect(rows[1]).toMatchObject({ id: "S11", verdict: "rejected", reason: "has no question" });
  });
});

/** Spec: `architecture/review`, "review asks the rows of the core and the rows of the schema". */
describe("the rubrics of a schema", () => {
  it("clean-react asks the core's rows, then its own, each of its own accepted", async () => {
    const { rubrics } = await loadSchema("clean-react");
    const rows = readRubric(PACKAGE_ROOT, rubrics);
    const ids = rows.map((r) => r.id);
    expect(ids.slice(0, 16)).toEqual(readRubric(PACKAGE_ROOT, rubrics[0]!).map((r) => r.id));
    expect(ids.slice(16)).toEqual(["S01", "S02", "S03", "S04", "S21", "S22", "S23"]);
    expect(rows.slice(16).filter((r) => r.verdict === "rejected")).toEqual([]);
  });

  it("refuses a row id that two rubrics carry", () => {
    const dir = mkdtempSync(join(tmpdir(), "rubrics-"));
    writeFileSync(join(dir, "package.json"), "{}");
    writeFileSync(join(dir, "a.md"), RUBRIC);
    writeFileSync(join(dir, "b.md"), RUBRIC);
    expect(() => readRubric(dir, [join(dir, "a.md"), join(dir, "b.md")])).toThrow(
      /rubric row S09 is in .*a\.md and in .*b\.md: a row id belongs to one rubric/,
    );
  });
});
