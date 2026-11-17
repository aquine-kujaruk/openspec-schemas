import type { ReadingArtifactRepositoryInterface } from "../../../../factory/production/application/repository-interfaces/reading-artifact.repository-interface.ts";

type Language = Awaited<ReturnType<ReadingArtifactRepositoryInterface["getLanguage"]>>;
type Copy = NonNullable<Awaited<ReturnType<ReadingArtifactRepositoryInterface["readCopy"]>>>;

export class InMemoryReadingArtifactRepository implements ReadingArtifactRepositoryInterface {
  private readonly artifacts = new Map<string, { fingerprint: string }>();
  private readonly copies = new Map<string, Copy>();
  private language: Language = {};
  readonly temporaryFolder = "/system-tmp/factory-reading";

  seed(path: string, fingerprint: string): void {
    this.artifacts.set(path, { fingerprint });
  }

  configureLanguage(language: Language): void {
    this.language = language;
  }

  writeCopy(path: string): void {
    this.copies.set(path, {});
  }

  async getLanguage(): Promise<Language> {
    return this.language;
  }

  async readArtifact(path: string): Promise<{ fingerprint: string } | null> {
    return this.artifacts.get(path) ?? null;
  }

  readingPath(language: string, source: string): string {
    return `${this.temporaryFolder}/${language}/test-plant/${source}`;
  }

  async readCopy(path: string): Promise<Copy | null> {
    return this.copies.get(path) ?? null;
  }

  async recordFingerprint(path: string, fingerprint: string): Promise<void> {
    this.copies.set(path, { fingerprint });
  }
}
