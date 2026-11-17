import { createHash } from "node:crypto";
import { existsSync, globSync, readFileSync, writeFileSync } from "node:fs";
import { join, relative } from "node:path";
import type { AuditAcl } from "../acl/audit.acl.ts";
import { outlineSource } from "./audit-outline.adapter.ts";

const RECORD_FILE = ".factory-review.json";

export class AuditAdapter implements AuditAcl {
  private readonly ask: AuditAcl["askQuestions"];
  private readonly head: AuditAcl["findCommit"];

  constructor(ask: AuditAcl["askQuestions"], head: AuditAcl["findCommit"]) {
    this.ask = ask;
    this.head = head;
  }

  listRubrics(_root: string, paths: string[]) {
    return paths.map((path) => ({ path, markdown: readFileSync(path, "utf8") }));
  }

  listPackageNames(root: string): string[] {
    const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8")) as {
      dependencies?: Record<string, string>;
      devDependencies?: Record<string, string>;
    };
    return Object.keys({ ...pkg.dependencies, ...pkg.devDependencies });
  }

  listCoreFiles(root: string, modules: string, folders: string[]) {
    return folders.flatMap((folder) =>
      globSync(`${modules}/${folder}/**/*.ts`, { cwd: root })
        .sort()
        .map((path) => ({
          path: relative(root, join(root, path)).replaceAll("\\", "/"),
          content: readFileSync(join(root, path), "utf8"),
          folder,
        })),
    ).filter((file) => !/\.(test|spec)\.ts$/.test(file.path));
  }

  readPass(root: string) {
    const file = join(root, RECORD_FILE);
    if (!existsSync(file)) return { files: {} };
    const pass = JSON.parse(readFileSync(file, "utf8")) as Partial<ReturnType<AuditAcl["readPass"]>>;
    return {
      ...(pass.rubric ? { rubric: pass.rubric } : {}),
      files: pass.files ?? {},
    };
  }

  savePass(root: string, pass: ReturnType<AuditAcl["readPass"]>): void {
    writeFileSync(join(root, RECORD_FILE), `${JSON.stringify(pass, null, 2)}\n`);
  }

  findCommit(root: string): string | null {
    return this.head(root);
  }

  hashContent(content: string): string {
    return createHash("sha256").update(content).digest("hex").slice(0, 16);
  }

  askQuestions(...args: Parameters<AuditAcl["askQuestions"]>) {
    return this.ask(...args);
  }

  outlineSource(source: Parameters<AuditAcl["outlineSource"]>[0]) {
    return outlineSource(source);
  }
}
