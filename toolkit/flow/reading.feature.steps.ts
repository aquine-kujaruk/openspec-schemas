import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, relative } from "node:path";
import { expect } from "vitest";
import { scratchProject, write } from "../core/testing.ts";
import { markWritten, type Reading, reading, readingsOf } from "./reading.ts";

/**
 * Each scenario asks for reading copies in a scratch project, with a temporary folder of its own
 * standing for the system's and an environment it writes. A copy "written" is one whose
 * translation was written and recorded with `--written`.
 */
export function createSteps() {
  const root = scratchProject("reading-");
  const tmp = mkdtempSync(join(tmpdir(), "reading-tmp-"));
  const env: NodeJS.ProcessEnv = {};
  let readings: Reading[] = [];
  let exited: number | undefined;

  return {
    // Context
    async projectLanguage(project: string): Promise<void> {
      write(root, "factory.config.ts", `export default { schema: "clean-backend"${project === "none" ? "" : `, language: "${project}"`} };\n`);
    },
    async personLanguage(person: string): Promise<void> {
      if (person !== "none") env.FACTORY_LANGUAGE = person;
    },
    async artifactWithCopy(artifact: string, state: string): Promise<void> {
      write(root, artifact, "# An artifact\n\nThe system SHALL keep this rule.\n");
      if (state === "missing") return;
      const [r] = await readingsOf(root, [artifact], { env, tmp });
      write(tmp, relative(tmp, r!.copy), "# Un artefacto\n\nEl sistema SHALL mantener esta regla.\n");
      await markWritten(root, [artifact], { env, tmp });
      if (state === "written before the artifact changed") write(root, artifact, "# An artifact\n\nThe system SHALL keep another rule.\n");
      else if (state !== "written after the artifact") throw new Error(`unknown state: ${state}`);
    },

    // Action
    async askReadingCopies(artifact: string): Promise<void> {
      const ran = await reading(root, [artifact], { env, tmp });
      exited = ran.status;
      readings = exited === 0 ? await readingsOf(root, [artifact], { env, tmp }) : [];
    },

    // Outcome
    async commandNamesCopy(copy: string): Promise<void> {
      if (copy === "no copy") return expect(readings).toEqual([]);
      const language = /^a copy in (\S+) outside the repository$/.exec(copy)?.[1];
      if (!language) throw new Error(`unknown copy: ${copy}`);
      expect(readings).toHaveLength(1);
      expect(readings[0]!.copy.startsWith(join(tmp, "factory-reading", language))).toBe(true);
      expect(relative(root, readings[0]!.copy).startsWith("..")).toBe(true);
    },
    async copyReported(freshness: string): Promise<void> {
      if (freshness === "none") return expect(readings).toEqual([]);
      expect(readings[0]!.fresh ? "fresh" : "stale").toBe(freshness);
    },
    async readingExitStatus(status: string): Promise<void> {
      expect(exited).toBe(Number(status));
    },
  };
}
