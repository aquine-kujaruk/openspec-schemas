import { describe, expect, it } from "vitest";
import { funnel } from "./funnel.ts";
import type { Row } from "./rubric.ts";
import { numbered, parse, partsOf, unitsOf } from "./units.ts";
import { fakeClient, markerClient } from "./fake-client.ts";

const S09: Row = {
  id: "S09",
  title: "A domain name says what happens in the business",
  question: "Does this file name a technology?",
  folders: ["domain"],
  crossFile: false,
};
const BATCH = { files: 8, chars: 60_000 };

const CLASS = `import { validateSchema } from "../../../shared/domain/schemas/validate.schema";

export class Order {
  constructor(private readonly props: { id: string; total: number }) {
    validateSchema(this, OrderSchema, props);
  }

  total(): number {
    const base = this.props.total;
    return base;
  }

  isEmpty(): boolean {
    return this.props.total === 0;
  }
}
`;
const file = (
  content: string,
  path = "src/orders/domain/entities/order.entity.ts",
  folder = "domain",
) => ({
  path,
  content,
  folder,
});

describe("AST units", () => {
  it("splits a file into top-level units without imports, and a class into header and members", () => {
    const parsed = parse("order.entity.ts", CLASS);
    const units = unitsOf(parsed);
    expect(units.map((u) => [u.label, u.from, u.to])).toEqual([["class Order", 3, 16]]);
    expect(partsOf(parsed, units[0]).map((u) => [u.label, u.from, u.to])).toEqual([
      ["header of class Order", 3, 3],
      ["constructor Order", 4, 6],
      ["method Order.total", 8, 11],
      ["method Order.isEmpty", 13, 15],
    ]);
  });
  it("splits a method into its statements and numbers the state", () => {
    const parsed = parse("order.entity.ts", CLASS);
    const total = partsOf(parsed, unitsOf(parsed)[0])[2];
    expect(partsOf(parsed, total).map((u) => [u.label, u.from, u.to])).toEqual([
      ["const base", 9, 9],
      ["statement", 10, 10],
    ]);
    expect(numbered("a\nb").split("\n")).toEqual(["   1 | a", "   2 | b"]);
  });
});

describe("funnel", () => {
  const run = (content: string, spanLines = 4, client = markerClient()) =>
    funnel({
      client,
      rows: [S09],
      files: [file(content)],
      threshold: 0.85,
      spanLines,
      batch: BATCH,
    });

  it("narrows a finding in one method to one range", async () => {
    const findings = await run(CLASS.replace("return base;", "return base; // SMELL"));
    expect(findings).toEqual([
      { row: "S09", p: 0.95, file: file("").path, from: 8, to: 11, title: S09.title },
    ]);
  });
  it("narrows findings in two methods to two ranges", async () => {
    const findings = await run(
      CLASS.replace("return base;", "return base; // SMELL").replace("=== 0;", "=== 0; // SMELL"),
    );
    expect(findings.map((f) => [f.from, f.to])).toEqual([
      [8, 11],
      [13, 15],
    ]);
  });
  it("narrows a finding in the class header to one range", async () => {
    const findings = await run(CLASS.replace("class Order {", "class Order { // SMELL"));
    expect(findings.map((f) => [f.from, f.to])).toEqual([[3, 3]]);
  });
  it("keeps narrowing a long method down to the statement", async () => {
    const findings = await run(CLASS.replace("return base;", "return base; // SMELL"), 2);
    expect(findings.map((f) => [f.from, f.to])).toEqual([[10, 10]]);
  });
  it("asks only the rows of a file's folder, in batches capped by files and size", async () => {
    const client = markerClient();
    const files = [
      file("export class A {}", "src/a/domain/entities/a.entity.ts"),
      file("export class B {}", "src/b/domain/entities/b.entity.ts"),
      file("export class C {}", "src/c/application/use-cases/c.use-case.ts", "application"),
    ];
    await funnel({
      client,
      rows: [S09],
      files,
      threshold: 0.85,
      spanLines: 40,
      batch: { files: 1, chars: 60_000 },
    });
    expect(client.calls.map((c) => c.questions.map((q) => q.name))).toEqual([
      ["S09_f0"],
      ["S09_f0"],
    ]);
    expect(client.calls.map((c) => c.state)).toEqual([
      "=== src/a/domain/entities/a.entity.ts ===\nexport class A {}",
      "=== src/b/domain/entities/b.entity.ts ===\nexport class B {}",
    ]);
  });
  it("drops a span the model answers below the threshold at a deeper stage", async () => {
    const client = fakeClient((q) =>
      q.instructions.startsWith("Consider only the file") ? 0.9 : 0.1,
    );
    expect(await run(CLASS, 4, client)).toEqual([]);
  });
});
