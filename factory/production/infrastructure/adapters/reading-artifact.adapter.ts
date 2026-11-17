import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { basename, dirname, join, resolve } from "node:path";
import { loadEnv } from "../../../shared/infrastructure/adapters/env.adapter.ts";
import { runtime } from "../../../shared/infrastructure/adapters/runtime.adapter.ts";
import type { ReadingArtifactAcl } from "../acl/reading-artifact.acl.ts";

const fingerprint = (text: string | Buffer) => createHash("sha256").update(text).digest("hex");

export class ReadingArtifactAdapter implements ReadingArtifactAcl {
  private readonly root: string;
  private readonly language: () => Promise<string | undefined>;

  constructor(root: string, language: () => Promise<string | undefined>) {
    this.root = root;
    this.language = language;
  }

  async getLanguage() {
    const person = loadEnv(this.root, runtime.environment()).FACTORY_LANGUAGE;
    return { person, project: person?.trim() ? undefined : await this.language() };
  }

  async readArtifact(path: string) {
    const file = join(this.root, path);
    return existsSync(file) && statSync(file).isFile()
      ? { fingerprint: fingerprint(readFileSync(file)) }
      : null;
  }

  readingPath(language: string, source: string) {
    return join(tmpdir(), "factory-reading", language, `${basename(this.root)}-${fingerprint(resolve(this.root)).slice(0, 8)}`, source);
  }

  async readCopy(path: string) {
    if (!existsSync(path)) return null;
    const sidecar = `${path}.source`;
    return { fingerprint: existsSync(sidecar) ? readFileSync(sidecar, "utf8").trim() : undefined };
  }

  async recordFingerprint(path: string, hash: string) {
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(`${path}.source`, `${hash}\n`);
  }
}
