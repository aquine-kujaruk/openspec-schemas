import { WorkOrderException } from "../exceptions/work-order.exceptions.ts";

export class ReadingCopyService {
  artifactPath(source: string): string {
    const path = source.replaceAll("\\", "/").replace(/^(?:\.\/)+/, "");

    if (!path.startsWith("openspec/") || path.split("/").includes(".."))
      throw new WorkOrderException(`${source} is not an artifact of openspec/: only what the specification tool keeps gets a reading copy`);

    return path;
  }

  language({ person, project }: { person?: string; project?: string }): string | undefined {
    const language = person?.trim() || project?.trim();

    return !language || /^en(?:[-_]|$)/i.test(language) ? undefined : language;
  }

  fresh(source: string, copy: string, written: boolean, saved: { fingerprint?: string } | null, fingerprint: string): boolean {
    if (written && !saved) throw new WorkOrderException(`the copy of ${source} was not written at ${copy}`);

    return written || saved?.fingerprint === fingerprint;
  }
}
