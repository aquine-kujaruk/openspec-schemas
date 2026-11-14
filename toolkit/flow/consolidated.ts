import { globSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { tagsOf } from "./plan.ts";

export const DECISIONS = "openspec/adr";
export const PROCEDURES = "openspec/runbooks";

/** A consolidated block: where it lives and the change that last wrote it. */
export type Standing = { file: string; origin?: string };

/** The consolidated decisions and procedures, by slug. A slug is unique within its tree. */
export type Consolidated = { decisions: Map<string, Standing>; procedures: Map<string, Standing> };

const tree = (root: string, dir: string, kind: "Decision" | "Procedure"): Map<string, Standing> => {
  const blocks = new Map<string, Standing>();
  const heading = new RegExp(`^### ${kind}: (\\S+)`);
  for (const file of globSync(`${dir}/**/*.md`, { cwd: root }).sort()) {
    let current: Standing | undefined;
    for (const line of readFileSync(join(root, file), "utf8").split("\n")) {
      const slug = heading.exec(line)?.[1];
      if (slug) {
        current = { file };
        blocks.set(slug, current);
      } else if (line.startsWith("#")) current = undefined;
      else if (current && line.trim().startsWith("@"))
        current.origin ??= tagsOf(line).find((t) => t.name === "origin")?.value;
    }
  }
  return blocks;
};

export const readConsolidated = (root: string): Consolidated => ({
  decisions: tree(root, DECISIONS, "Decision"),
  procedures: tree(root, PROCEDURES, "Procedure"),
});
