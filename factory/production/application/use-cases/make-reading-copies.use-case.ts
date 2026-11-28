import type { ReadingArtifactRepositoryInterface } from "../repository-interfaces/reading-artifact.repository-interface.ts";
import { ReadingCopyService } from "../../domain/services/reading-copy.service.ts";

type Reading = { source: string; copy: string; fresh: boolean };

export class MakeReadingCopiesUseCase {
  private readonly artifacts: ReadingArtifactRepositoryInterface;
  private readonly policy = new ReadingCopyService();

  constructor(artifacts: ReadingArtifactRepositoryInterface) {
    this.artifacts = artifacts;
  }

  async readingsOf(paths: string[]): Promise<Reading[]> {
    return this.readings(paths, false);
  }

  async markWritten(paths: string[]): Promise<Reading[]> {
    return this.readings(paths, true);
  }

  private async readings(paths: string[], written: boolean): Promise<Reading[]> {
    const sources = await Promise.all(paths.map(async (source) => {
      const path = this.policy.artifactPath(source);
      const { fingerprint } = await this.artifacts.getArtifact(path);

      return { source: path, fingerprint };
    }));

    const language = this.policy.language(await this.artifacts.getLanguage());
    if (!language) return [];

    const copies: Reading[] = [];

    for (const { source, fingerprint } of sources) {
      const copy = this.artifacts.readingPath(language, source);
      const fresh = this.policy.fresh(source, copy, written, await this.artifacts.readCopy(copy), fingerprint);
      if (written) await this.artifacts.recordFingerprint(copy, fingerprint);
      copies.push({ source, copy, fresh });
    }

    return copies;
  }

  async execute(args: string[]): Promise<{ status: number; lines: string[] }> {
    const paths = args.filter((arg) => !arg.startsWith("--"));

    if (!paths.length)
      return { status: 2, lines: ["Name the artifacts of openspec/ to show: factory reading [--written] <paths…>"] };

    try {
      const readings = args.includes("--written") ? await this.markWritten(paths) : await this.readingsOf(paths);

      return { status: 0, lines: readings.length
        ? readings.map(({ source, copy, fresh }) => `${source} -> ${copy} ${fresh ? "fresh" : "stale"}`)
        : ["no language other than English is configured: show the artifacts as they are"] };
    } catch (failure) {
      return { status: 1, lines: [failure instanceof Error ? failure.message : String(failure)] };
    }
  }
}
