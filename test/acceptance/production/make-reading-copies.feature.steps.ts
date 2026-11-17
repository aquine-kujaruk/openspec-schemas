// Synced by feat2test. Matching step implementations are preserved.

import { expect } from "vitest";
import { MakeReadingCopiesUseCase } from "../../../factory/production/application/use-cases/make-reading-copies.use-case.ts";
import { InMemoryReadingArtifactRepository } from "./repositories/in-memory-reading-artifact.repository.ts";

export function createSteps() {
  const repository = new InMemoryReadingArtifactRepository();
  const reading = new MakeReadingCopiesUseCase(repository);
  let projectSetting: string | undefined;
  let readings: Awaited<ReturnType<MakeReadingCopiesUseCase["readingsOf"]>> = [];
  let response: Awaited<ReturnType<MakeReadingCopiesUseCase["execute"]>>;

  return {
    // Context
    projectLanguage(project: string): void {
      projectSetting = project === "none" ? undefined : project;
      repository.configureLanguage({ project: projectSetting });
    },
    personLanguage(person: string): void {
      repository.configureLanguage({
        project: projectSetting,
        person: person === "none" ? undefined : person,
      });
    },
    async artifactWithCopy(artifact: string, state: string): Promise<void> {
      repository.seed(artifact, "original");
      if (state === "missing") return;
      expect(["written before the artifact changed", "written after the artifact"]).toContain(state);
      const [pending] = await reading.readingsOf([artifact]);
      expect(pending).toBeDefined();
      repository.writeCopy(pending!.copy);
      await reading.markWritten([artifact]);
      if (state === "written before the artifact changed") repository.seed(artifact, "edited");
    },

    // Action
    async askReadingCopies(artifact: string): Promise<void> {
      response = await reading.execute([artifact]);
      readings = response.status === 0 ? await reading.readingsOf([artifact]) : [];
    },

    // Outcome
    commandNamesCopy(copy: string): void {
      if (copy === "no copy") {
        expect(readings).toEqual([]);
        expect(response.lines.join("\n")).toContain("show the artifacts as they are");
        return;
      }
      const language = /^a copy in (\S+) outside the repository$/.exec(copy)?.[1];
      expect(language, copy).toBeDefined();
      expect(readings).toHaveLength(1);
      expect(readings[0]!.copy.startsWith(`${repository.temporaryFolder}/${language}/`)).toBe(true);
      expect(response.lines.join("\n")).toContain(readings[0]!.copy);
    },
    copyReported(freshness: string): void {
      if (freshness === "none") {
        expect(readings).toEqual([]);
        return;
      }
      expect(readings[0]?.fresh ? "fresh" : "stale").toBe(freshness);
      expect(response.lines.join("\n")).toMatch(new RegExp(` ${freshness}$`));
    },
    readingExitStatus(status: string): void {
      expect(response.status).toBe(Number(status));
    },
  };
}
