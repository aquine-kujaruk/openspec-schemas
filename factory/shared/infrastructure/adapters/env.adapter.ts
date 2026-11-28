import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

export const loadEnv = (
  root: string,
  env: NodeJS.ProcessEnv,
): Record<string, string | undefined> => {
  const file = join(root, ".env");
  const fromFile: Record<string, string> = {};

  if (existsSync(file))
    for (const line of readFileSync(file, "utf8").split("\n")) {
      const m =
        /^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/.exec(line);

      if (m && !line.trim().startsWith("#"))
        fromFile[m[1]!] = m[2]!.replace(/^(["'])(.*)\1$/, "$2");
    }

  return { ...fromFile, ...env };
};
