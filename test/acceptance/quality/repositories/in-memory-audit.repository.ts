import { expect } from "vitest";
import type { AuditRepositoryInterface } from "../../../../factory/quality/application/repository-interfaces/audit.repository-interface.ts";
import type {
  AuditFile, AuditPass, AuditQuestion, AuditRubric, AuditSource, AuditSpan,
} from "../../../../factory/quality/domain/schemas/audit-material.schema.ts";

export class InMemoryAuditRepository implements AuditRepositoryInterface {
  private readonly files: Record<string, string> = {};
  private readonly rubrics = new Map<string, string>();
  private pass: AuditPass = { files: {} };
  private judge = (question: AuditQuestion): number => question.excerpt.includes("SMELL") ? 0.95 : 0.05;
  readonly calls: AuditQuestion[][] = [];

  seed(input: {
    files?: Record<string, string>;
    rubric?: AuditRubric;
    pass?: AuditPass;
    judge?: (question: AuditQuestion) => number;
  }): void {
    if (input.files) Object.assign(this.files, input.files);
    if (input.rubric) this.rubrics.set(input.rubric.path, input.rubric.markdown);
    if (input.pass) this.pass = input.pass;
    if (input.judge) this.judge = input.judge;
  }

  listRubrics(_root: string, paths: string[]): AuditRubric[] {
    return paths.map((path) => {
      const markdown = this.rubrics.get(path);
      expect(markdown, path).toBeDefined();
      return { path, markdown: markdown! };
    });
  }

  listPackageNames(): string[] {
    return [];
  }

  listCoreFiles(_root: string, modules: string, folders: string[]): AuditFile[] {
    return folders.flatMap((folder) => Object.entries(this.files)
      .filter(([path]) => path.startsWith(modules.split("*")[0]) && path.includes(`/${folder}/`))
      .map(([path, content]) => ({ path, content, folder })));
  }

  readPass(): AuditPass {
    return this.pass;
  }

  savePass(_root: string, pass: AuditPass): void {
    this.pass = pass;
  }

  findCommit(): string {
    return "abc123";
  }

  hashContent(content: string): string {
    return content;
  }

  async askQuestions(_state: string, questions: AuditQuestion[]) {
    this.calls.push(questions);
    return new Map(questions.map((question) => [question.name, this.judge(question)]));
  }

  outlineSource(_source: AuditSource): AuditSpan[] {
    return [{
      from: 1, to: 14, label: "class Order",
      parts: [
        { from: 1, to: 1, label: "header of class Order", parts: [] },
        { from: 2, to: 4, label: "constructor Order", parts: [] },
        { from: 6, to: 9, label: "method Order.total", parts: [] },
        { from: 11, to: 13, label: "method Order.isEmpty", parts: [] },
      ],
    }];
  }
}
