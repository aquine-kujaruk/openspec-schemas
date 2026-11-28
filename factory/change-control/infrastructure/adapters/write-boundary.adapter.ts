import { existsSync, readFileSync } from "node:fs";
import { dirname, isAbsolute, join, relative, resolve } from "node:path";
import { runtime } from "../../../shared/infrastructure/adapters/runtime.adapter.ts";
import type { WriteBoundaryAcl, WriteBoundaryRecord } from "../acl/write-boundary.acl.ts";

export class WriteBoundaryAdapter implements WriteBoundaryAcl {
  private readonly root: string;
  private readonly cwd: string;
  private readonly configuration: () => Promise<WriteBoundaryRecord>;

  constructor(root: string, cwd: string, configuration: () => Promise<WriteBoundaryRecord>) {
    this.root = root;
    this.cwd = cwd;
    this.configuration = configuration;
  }

  readConfiguration(): Promise<WriteBoundaryRecord> {
    return this.configuration();
  }

  projectPath(file: string): string | null {
    const path = relative(this.root, resolve(this.cwd, file)).split("\\").join("/");

    return path.startsWith("..") || isAbsolute(path) ? null : path;
  }

  static projectOf(cwd: string): string {
    for (let dir = resolve(cwd); ; dir = dirname(dir)) {
      if (existsSync(join(dir, "openspec"))) return dir;
      if (dirname(dir) === dir) return resolve(cwd);
    }
  }

  static hookInput(): { cwd?: string } & Record<string, unknown> {
    if (runtime.interactive()) return {};
    const text = readFileSync(0, "utf8").trim();

    return text ? (JSON.parse(text) as { cwd?: string }) : {};
  }
}
