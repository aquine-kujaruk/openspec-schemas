import type { ReadingArtifactRepositoryInterface } from "../repository-interfaces/reading-artifact.repository-interface.ts";
import { WorkOrderException } from "../../domain/exceptions/work-order.exceptions.ts";

type Reading = { source: string; copy: string; fresh: boolean };

export class MakeReadingCopiesUseCase {
  private readonly artifacts: ReadingArtifactRepositoryInterface;

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
      const path = source.replaceAll("\\", "/").replace(/^(?:\.\/)+/, "");
      if (!path.startsWith("openspec/") || path.split("/").includes(".."))
        throw new WorkOrderException(`${source} is not an artifact of openspec/: only what the specification tool keeps gets a reading copy`);
      const record = await this.artifacts.readArtifact(path);
      if (!record) throw new WorkOrderException(`${source} does not exist`);
      return { source: path, fingerprint: record.fingerprint };
    }));
    const { person, project } = await this.artifacts.getLanguage();
    const language = person?.trim() || project?.trim();
    if (!language || /^en(?:[-_]|$)/i.test(language)) return [];
    const copies: Reading[] = [];
    for (const { source, fingerprint } of sources) {
      const copy = this.artifacts.readingPath(language, source);
      const saved = await this.artifacts.readCopy(copy);
      if (written && !saved) throw new WorkOrderException(`the copy of ${source} was not written at ${copy}`);
      if (written) await this.artifacts.recordFingerprint(copy, fingerprint);
      copies.push({ source, copy, fresh: written || saved?.fingerprint === fingerprint });
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
