import { readInstalled } from "../package/doctor.ts";
import { PROJECT_ROOT } from "../core/paths.ts";
import { loadDefinition, schemaNames } from "./schema.ts";

/** A schema of the package as the plan phase chooses among them: its name, when to use it, and what it builds through. */
export type Listed = { name: string; description: string; workstreams: string[] };

/** The schemas of the package the project at `root` has: those it installed, or all of them where the package is developed. */
export const listSchemas = async (root: string): Promise<Listed[]> => {
  const defined = schemaNames();
  const names = (readInstalled(root)?.installed.schemas ?? defined).filter((n) => defined.includes(n));
  const listed: Listed[] = [];
  for (const name of names) {
    const { description, workstreams } = await loadDefinition(name);
    listed.push({ name, description, workstreams });
  }
  return listed;
};

/** `factory schemas [--json]`: the schemas a change of this project can be opened with, and when each is used. */
export const run = async (args: string[]): Promise<number> => {
  const listed = await listSchemas(PROJECT_ROOT);
  if (args.includes("--json")) console.log(JSON.stringify(listed, null, 2));
  else
    for (const { name, description, workstreams } of listed)
      console.log(
        `${name}\n  ${description}\n  ${workstreams.length ? `workstreams: ${workstreams.join(", ")}` : "no workstreams: its tasks name none"}`,
      );
  return 0;
};
