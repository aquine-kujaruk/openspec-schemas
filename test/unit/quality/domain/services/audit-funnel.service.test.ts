import { describe, expect, it } from "vitest";
import { AuditFunnelService } from "../../../../../factory/quality/domain/services/audit-funnel.service.ts";
import type { AuditFile, AuditQuestion, AuditRow, AuditSpan } from "../../../../../factory/quality/domain/schemas/audit-material.schema.ts";

const S09: AuditRow = {
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

const outline = (source: AuditFile): AuditSpan[] =>
  source.content.startsWith("import ")
    ? [
      span(3, 16, "class Order", [
        span(3, 3, "header of class Order"),
        span(4, 6, "constructor Order"),
        span(8, 11, "method Order.total", [span(9, 9, "const base"), span(10, 10, "statement")]),
        span(13, 15, "method Order.isEmpty", [span(14, 14, "statement")]),
      ]),
    ]
    : [span(1, 1, "class")];

const span = (from: number, to: number, label: string, parts: AuditSpan[] = []): AuditSpan =>
  ({ from, to, label, parts });

const fakeClient = (judge: (question: AuditQuestion) => number) => {
  const calls: Array<{ state: string; questions: AuditQuestion[] }> = [];
  return {
    calls,
    async ask(state: string, questions: AuditQuestion[]): Promise<Map<string, number>> {
      calls.push({ state, questions });
      return new Map(questions.map((question) => [question.name, judge(question)]));
    },
  };
};

const markerClient = () => fakeClient(
  (question) => question.excerpt.includes("SMELL") ? 0.95 : 0.05,
);


describe("audit funnel", () => {
  const service = new AuditFunnelService();
  const run = (content: string, spanLines = 4, client = markerClient()) =>
    service.inspect({
      ask: client.ask,
      outline,
      rows: [S09],
      files: [file(content)],
      threshold: 0.85,
      spanLines,
      batch: BATCH,
    });

  it("narrows a finding in one method to one range", async () => {
    const findings = await run(
      CLASS.replace("return base;", "return base; // SMELL"),
    );
    expect(findings).toEqual([
      {
        row: "S09",
        verdict: "accepted",
        p: 0.95,
        file: file("").path,
        from: 8,
        to: 11,
        title: S09.title,
      },
    ]);
  });
  it("narrows findings in two methods to two ranges", async () => {
    const findings = await run(
      CLASS.replace("return base;", "return base; // SMELL").replace(
        "=== 0;",
        "=== 0; // SMELL",
      ),
    );
    expect(findings.map((f) => [f.from, f.to])).toEqual([
      [8, 11],
      [13, 15],
    ]);
  });
  it("narrows a finding in the class header to one range", async () => {
    const findings = await run(
      CLASS.replace("class Order {", "class Order { // SMELL"),
    );
    expect(findings.map((f) => [f.from, f.to])).toEqual([[3, 3]]);
  });
  it("keeps narrowing a long method down to the statement", async () => {
    const findings = await run(
      CLASS.replace("return base;", "return base; // SMELL"),
      2,
    );
    expect(findings.map((f) => [f.from, f.to])).toEqual([[10, 10]]);
  });
  it("asks only the rows of a file's folder, in batches capped by files and size", async () => {
    const client = markerClient();
    const files = [
      file("export class A {}", "src/a/domain/entities/a.entity.ts"),
      file("export class B {}", "src/b/domain/entities/b.entity.ts"),
      file(
        "export class C {}",
        "src/c/application/use-cases/c.use-case.ts",
        "application",
      ),
    ];
    await service.inspect({
      ask: client.ask,
      outline,
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
  it("numbers source lines when asking about a span", async () => {
    const client = fakeClient(() => 0.95);
    await run("a\nb", 40, client);

    expect(client.calls[1]?.state).toBe("   1 | a\n   2 | b");
  });

  it("drops a span the model answers below the threshold at a deeper stage", async () => {
    const client = fakeClient((q) =>
      q.instructions.startsWith("Consider only the file") ? 0.9 : 0.1,
    );
    expect(await run(CLASS, 4, client)).toEqual([]);
  });
});
