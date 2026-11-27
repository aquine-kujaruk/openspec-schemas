import { DEFAULTS } from "../../../factory/shared/domain/schemas/review.schema.ts";
import { AuditUseCase } from "../../../factory/quality/application/use-cases/audit.use-case.ts";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import type { AuditQuestion } from "../../../factory/quality/domain/schemas/audit-material.schema.ts";
import { AuditRecordService } from "../../../factory/quality/domain/services/audit-record.service.ts";
import { QualityException } from "../../../factory/quality/domain/exceptions/quality.exceptions.ts";
import type { AuditAcl } from "../../../factory/quality/infrastructure/acl/audit.acl.ts";
import { AuditAdapter } from "../../../factory/quality/infrastructure/adapters/audit.adapter.ts";
import { inspect, openAiClient } from "../../../factory/quality/infrastructure/adapters/audit-decision.adapter.ts";
import { AuditRepositoryImplementation } from "../../../factory/quality/infrastructure/repository-implementations/audit.repository-implementation.ts";

const q = (name: string): AuditQuestion => ({
  name,
  instructions: `Is ${name} present?`,
  excerpt: "",
});

/** A response as the Decisions API returns it, recorded once. */
const RECORDED = {
  id: "dec_01",
  model: "gpt-6-luna",
  answers: [
    { type: "predicate", name: "S09_f0", probability: 0.93 },
    { type: "predicate", name: "S09_f1", probability: 0.07 },
    { type: "refusal", name: "S09_f2" },
    { type: "predicate", name: "S09_f3", probability: 1.4 },
  ],
  usage: { input_tokens: 476, input_tokens_details: { cached_tokens: 0 } },
};

describe("decision client", () => {
  it("parses the probabilities of a recorded response and reports the rest as issues", () => {
    const { answers, issues, unreadable } = inspect(
      ["S09_f0", "S09_f1", "S09_f2", "S09_f3", "S09_f4"].map(q),
      RECORDED,
    );
    expect([...answers]).toEqual([
      ["S09_f0", 0.93],
      ["S09_f1", 0.07],
    ]);
    expect(issues).toEqual([
      "S09_f2: refused",
      "S09_f3: probability not in [0,1]",
      "S09_f4: missing answer",
    ]);
    expect(unreadable).toBe(false);
  });
  it("reports a missing answer as no answer, never as zero", () => {
    const { answers } = inspect([q("a")], { answers: [] });
    expect(answers.has("a")).toBe(false);
    expect(answers.get("a")).toBeUndefined();
  });
  it("flags a state the model could not read: every answer at ~0.5", () => {
    const { unreadable } = inspect([q("a"), q("b")], {
      answers: [
        { type: "predicate", name: "a", probability: 0.49 },
        { type: "predicate", name: "b", probability: 0.52 },
      ],
    });
    expect(unreadable).toBe(true);
  });
  it("posts predicate questions with the key in the header and retries once on 5xx", async () => {
    const requests: Array<{ url: string; init: RequestInit }> = [];
    let n = 0;
    const fetchFake: typeof fetch = async (url, init) => {
      requests.push({
        url: url instanceof Request ? url.url : url.toString(),
        init: init!,
      });
      n++;
      return n === 1
        ? new Response("boom", { status: 503 })
        : new Response(JSON.stringify(RECORDED), { status: 200 });
    };
    const issues: string[] = [];
    const client = openAiClient({
      key: "sk-test",
      model: "gpt-6-luna",
      fetch: fetchFake,
      onIssue: (i) => issues.push(i),
    });
    const answers = await client.ask("the state", [q("S09_f0"), q("S09_f2")]);
    expect(answers.get("S09_f0")).toBe(0.93);
    expect(issues).toEqual(["S09_f2: refused"]);
    expect(client.requests).toBe(2);
    expect(requests[0].url).toBe("https://api.openai.com/v1/decisions");
    expect(
      (requests[0].init.headers as Record<string, string>).Authorization,
    ).toBe("Bearer sk-test");
    expect(JSON.parse(requests[1].init.body as string)).toEqual({
      model: "gpt-6-luna",
      input: "the state",
      questions: [
        {
          type: "predicate",
          name: "S09_f0",
          instructions: "Is S09_f0 present?",
        },
        {
          type: "predicate",
          name: "S09_f2",
          instructions: "Is S09_f2 present?",
        },
      ],
    });
  }, 10_000);
  it("fails without retrying on another 4xx and never leaks the key", async () => {
    const fetchFake: typeof fetch = async () =>
      new Response("bad request", { status: 400 });
    const client = openAiClient({
      key: "sk-secret",
      model: "gpt-6-luna",
      fetch: fetchFake,
    });
    await expect(client.ask("s", [q("a")])).rejects.toThrow(
      "HTTP 400: bad request",
    );
    await expect(client.ask("s", [q("a")])).rejects.not.toThrow("sk-secret");
    expect(client.requests).toBe(2);
  });
});

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
const repositoryWith = (resources: AuditAcl) => new AuditRepositoryImplementation(resources);
const fileAdapter = () => new AuditAdapter(async () => new Map(), () => "abc123");

describe("audit material", () => {
  it("preserves independent findings and locates an unanswered predicate without advancing the pass", async () => {
    const root = mkdtempSync(join(tmpdir(), "partial-audit-"));
    try {
      const dir = join(root, "factory/catalog/domain");
      mkdirSync(dir, { recursive: true });
      for (const name of ["a", "b"]) writeFileSync(join(dir, name + ".ts"), "export const label = 1;");
      writeFileSync(join(root, "package.json"), "{}");
      const rubric = join(root, "rubric.md");
      writeFileSync(rubric, "### Reviewer rubric\n| S19 | Core policy | Is the policy broken? | domain |\n");
      const adapter = new AuditAdapter(async (_state, questions) =>
        new Map(questions.filter(q => q.name !== "S19_f0").map(q => [q.name, 1])), () => null);
      const report = await new AuditUseCase(repositoryWith(adapter)).execute({
        root, modules: "factory/*", config: DEFAULTS, rubrics: [rubric], key: "fixture",
      });
      expect(report).toMatchObject({ code: 4, incomplete: ["the model failed: missing answer for S19_f0 at factory/catalog/domain/a.ts"],
        findings: [expect.objectContaining({ file: "factory/catalog/domain/b.ts" })] });
      expect(adapter.readPass(root).files).toEqual({});
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("selects TS and TSX from the configured product root and excludes its test files", () => {
    const root = mkdtempSync(join(tmpdir(), "audit-roots-"));
    try {
      for (const tree of ["factory", "src"]) {
        const dir = join(root, tree, "catalog", "framework");
        mkdirSync(dir, { recursive: true });
        for (const file of ["query.ts", "view.tsx", "view.test.tsx", "query.spec.ts"])
          writeFileSync(join(dir, file), "export {};");
      }
      const files = fileAdapter().listCoreFiles(root, "factory/*", ["framework"]);
      expect(files.map(file => file.path)).toEqual(["factory/catalog/framework/query.ts", "factory/catalog/framework/view.tsx"]);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("splits a class and method through its configured parser", () => {
    const repository = repositoryWith(fileAdapter());
    const [unit] = repository.outlineSource({ path: "order.entity.ts", content: CLASS });
    expect([unit.label, unit.from, unit.to]).toEqual(["class Order", 3, 16]);
    expect(unit.parts.map(({label, from, to}) => [label, from, to])).toEqual([
      ["header of class Order", 3, 3],
      ["constructor Order", 4, 6],
      ["method Order.total", 8, 11],
      ["method Order.isEmpty", 13, 15],
    ]);
    expect(unit.parts[2].parts.map(({label, from, to}) => [label, from, to])).toEqual([
      ["const base", 9, 9],
      ["statement", 10, 10],
    ]);
  });

  it("keeps the disk record format and reads both kinds of project dependencies", () => {
    const root = mkdtempSync(join(tmpdir(), "factory-audit-"));
    try {
      const repository = repositoryWith(fileAdapter());
      const records = new AuditRecordService((value) => repository.hashContent(value));
      const first = { path: "src/a/domain/entities/a.entity.ts", content: "export class A {}" };
      const second = { path: "src/b/domain/entities/b.entity.ts", content: "export class B {}" };
      const empty = repository.readPass(root);

      expect(empty).toEqual({ files: {} });
      const pass = records.recordPass(empty, [second, first], repository.findCommit(root), "rubric");
      repository.savePass(root, pass);
      const raw = readFileSync(join(root, ".factory-review.json"), "utf8");
      expect(repository.readPass(root)).toEqual({
        rubric: "rubric",
        files: {
          [first.path]: { hash: repository.hashContent(first.content), commit: "abc123" },
          [second.path]: { hash: repository.hashContent(second.content), commit: "abc123" },
        },
      });
      expect(raw.indexOf(first.path)).toBeLessThan(raw.indexOf(second.path));
      expect(raw).toMatch(/\n$/);

      writeFileSync(join(root, "package.json"), JSON.stringify({
        dependencies: { pg: "1" },
        devDependencies: { zod: "2" },
      }));
      expect(repository.listPackageNames(root)).toEqual(["pg", "zod"]);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("keeps the resource failure as the cause of the domain exception", async () => {
    const cause = new Error("model unavailable");
    const resources: AuditAcl = {
      listRubrics: () => [],
      listPackageNames: () => [],
      listCoreFiles: () => [],
      readPass: () => ({ files: {} }),
      savePass: () => {},
      findCommit: () => null,
      hashContent: (value) => value,
      askQuestions: async () => { throw cause; },
      outlineSource: () => [],
    };
    const repository = repositoryWith(resources);
    await expect(repository.askQuestions("file", [q("q")])).rejects.toBeInstanceOf(QualityException);
    await expect(repository.askQuestions("file", [q("q")])).rejects.toMatchObject({ cause });
  });
});
