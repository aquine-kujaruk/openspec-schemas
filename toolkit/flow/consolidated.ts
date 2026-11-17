import { globSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { tagsOf } from "./plan.ts";

export const DECISIONS = "openspec/adr";
export const PROCEDURES = "openspec/runbooks";

/** A consolidated block: where it lives and the change that last wrote it. */
export type Standing = { file: string; origin?: string; keys?: string[]; body: string };

/** The consolidated decisions and procedures, by slug. A slug is unique within its tree. */
export type Consolidated = { decisions: Map<string, Standing>; procedures: Map<string, Standing> };

const tree = (root: string, dir: string, kind: "Decision" | "Procedure"): Map<string, Standing> => {
  const blocks = new Map<string, Standing>();
  const heading = new RegExp(`^### ${kind}: (\\S+)`);
  for (const file of globSync(`${dir}/**/*.md`, { cwd: root }).sort()) {
    let current: Standing | undefined;
    // A line of a fenced block (a shell comment, say) is never a heading.
    let fenced = false;
    for (const line of readFileSync(join(root, file), "utf8").split("\n")) {
      const slug = fenced ? undefined : heading.exec(line)?.[1];
      if (slug) {
        current = { file, body: "" };
        blocks.set(slug, current);
        continue;
      }
      if (!fenced && line.startsWith("#")) {
        current = undefined;
        continue;
      }
      if (/^\s*(```|~~~)/.test(line)) fenced = !fenced;
      if (current) current.body += `${line}\n`;
      if (current && !fenced && line.trim().startsWith("@")) {
        const tags = tagsOf(line);
        current.origin ??= tags.find((t) => t.name === "origin")?.value;
        const keys = tags.find((t) => t.name === "keys")?.value;
        if (keys) current.keys ??= keys.split(",").filter(Boolean);
      }
    }
  }
  return blocks;
};

export const readConsolidated = (root: string): Consolidated => ({
  decisions: tree(root, DECISIONS, "Decision"),
  procedures: tree(root, PROCEDURES, "Procedure"),
});
