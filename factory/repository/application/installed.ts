import type { Installed } from "../../shared/domain/types.ts";
import type { InstalledPorts } from "../domain/installed.ts";

/** Builds these use cases from their capabilities; importing them touches no resources. */
export const createInstalled = ({
  existsSync,
  readFileSync,
  join,
  SETUP_ASSETS,
  INSTALLED,
}: InstalledPorts): typeof import("../domain/installed.ts") => {
  /** Where each agent reads what a package deploys for it. */
  type Place = {
    skills: string;
    /** A rule file per instruction, or one instruction file the project may have written. */
    instruction: { rules: string } | { file: string };
    hooks: string;
  };

  const PLACES: Record<string, Place> = {
    claude: {
      skills: ".claude/skills",
      instruction: { rules: ".claude/rules" },
      hooks: ".claude/settings.json",
    },
    codex: {
      skills: ".agents/skills",
      instruction: { file: "AGENTS.md" },
      hooks: ".codex/hooks.json",
    },
  };

  const text = (path: string): string | undefined =>
    existsSync(path) ? readFileSync(path, "utf8") : undefined;

  /** What the installed package says about itself, read from the first agent that has its setup skill. */
  const readInstalled = (
    root: string,
  ): { installed: Installed; assets: string } | undefined => {
    for (const place of Object.values(PLACES)) {
      const assets = join(place.skills, SETUP_ASSETS);
      const record = text(join(root, assets, INSTALLED));
      if (record) return { installed: JSON.parse(record) as Installed, assets };
    }
    return undefined;
  };
  return { PLACES, readInstalled };
};
