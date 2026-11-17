import type {
  Standing,
  Consolidated,
} from "../../shared/domain/consolidated.ts";
import type { ConsolidatedPorts } from "../../shared/domain/consolidated.ts";

/** Builds these use cases from their capabilities; importing them touches no resources. */
export const createConsolidated = ({
  globSync,
  readFileSync,
  join,
  tagsOf,
}: ConsolidatedPorts): typeof import("../../shared/domain/consolidated.ts") => {
  const DECISIONS = "openspec/adr";

  const PROCEDURES = "openspec/runbooks";

  /** A consolidated block: where it lives and the change that last wrote it. */

  /** The consolidated decisions and procedures, by slug. A slug is unique within its tree. */

  const tree = (
    root: string,
    dir: string,
    kind: "Decision" | "Procedure",
  ): Map<string, Standing> => {
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

  const readConsolidated = (root: string): Consolidated => ({
    decisions: tree(root, DECISIONS, "Decision"),
    procedures: tree(root, PROCEDURES, "Procedure"),
  });
  return { DECISIONS, PROCEDURES, readConsolidated };
};
