import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import type { Standing } from "../flow/consolidated.ts";

/** What a runbook's command needs from the project for it to still run. */
export type Need =
  | { kind: "script"; name: string }
  | { kind: "binary"; name: string }
  | { kind: "file"; path: string };

/** A command a runbook runs, as written, with what it needs from the project. */
export type Run = { command: string; need: Need };

/** The subcommands of pnpm that run no script of the project. `start` and `test` run one. */
const PNPM_OWN = new Set(
  "add install i update up upgrade remove rm uninstall un link ln unlink import rebuild rb prune fetch patch patch-commit patch-remove audit list ls outdated why licenses exec run dlx create init publish pack store setup env config get set bin root server deploy doctor approve-builds ignored-builds self-update recursive multi m cat-file cat-index find-hash help".split(
    " ",
  ),
);
/** The subcommands of yarn that run no script of the project. */
const YARN_OWN = new Set(
  "add install remove upgrade up why info init dlx exec node workspace workspaces config cache set plugin pack npm constraints link unlink bin global create version audit outdated list login logout publish import licenses policies autoclean check owner tag team upgrade-interactive help".split(
    " ",
  ),
);
const INTERPRETERS = new Set(["node", "tsx", "bash", "sh"]);

/** The code of a procedure's body: each line of its fenced blocks and each inline code span. */
export const codeOf = (body: string): string[] => {
  const code: string[] = [];
  let fenced = false;
  for (const line of body.split("\n")) {
    if (/^\s*(```|~~~)/.test(line)) {
      fenced = !fenced;
      continue;
    }
    if (fenced) code.push(line);
    else for (const [, span] of line.matchAll(/`([^`]+)`/g)) code.push(span!);
  }
  return code;
};

/** A token that names something only known when the command runs: a variable, a placeholder, a glob. */
const unknown = (token: string): boolean => /[$<>{}*`]/.test(token);

const unquote = (token: string): string => token.replace(/^["']|["']$/g, "");

/** What one simple command (no `&&`, `|` or `;`) needs, when it is one doctor can judge. */
const needOf = (words: string[]): Need | undefined => {
  const tokens = words.map(unquote);
  // Leading variable assignments (`PORT=3000 pnpm dev`) set the environment and run nothing.
  while (tokens[0] && /^\w+=/.test(tokens[0])) tokens.shift();
  const [head, first, second] = tokens;
  if (!head || tokens.slice(0, 3).some((t) => t && unknown(t))) return undefined;
  const script = (name?: string): Need | undefined =>
    name && !name.startsWith("-") ? { kind: "script", name } : undefined;
  if (head === "pnpm") {
    if (first === "run" || first === "run-script") return script(second);
    if (first === "exec") return second && !second.startsWith("-") ? { kind: "binary", name: second } : undefined;
    return first && !PNPM_OWN.has(first) ? script(first) : undefined;
  }
  if (head === "npm") {
    if (first === "run" || first === "run-script") return script(second);
    return first === "start" || first === "test" ? script(first) : undefined;
  }
  if (head === "yarn") {
    if (first === "run") return script(second);
    return first && !YARN_OWN.has(first) ? script(first) : undefined;
  }
  if (head === "npx") {
    // A flag may take a package (`-p`), and a package at a version is fetched: neither is judged.
    if (!first || first.startsWith("-") || first.lastIndexOf("@") > 0) return undefined;
    return { kind: "binary", name: first };
  }
  if (INTERPRETERS.has(head))
    return first && !first.startsWith("-") ? { kind: "file", path: first } : undefined;
  if (head.startsWith("./")) return { kind: "file", path: head };
  return undefined;
};

/** The commands a procedure's body runs that doctor can judge. */
export const runsOf = (body: string): Run[] =>
  codeOf(body).flatMap((code) =>
    code
      .replace(/^\s*\$\s+/, "")
      .split(/&&|\|\||;|\|/)
      .map((part) => part.trim().split(/\s+/).filter(Boolean))
      .flatMap((words) => {
        const need = needOf(words);
        return need ? [{ command: words.join(" "), need }] : [];
      }),
  );

/** What the project has where a runbook may look: the scripts, binaries and files of its roots. */
export type Holdings = { scripts: Set<string>; binaries: (name: string) => boolean; file: (path: string) => boolean };

/** The holdings of the repository at `root` and of every product folder in `roots`. */
export const holdingsOf = (root: string, roots: string[]): Holdings => {
  const folders = [...new Set([".", ...roots])].map((r) => join(root, r));
  const scripts = new Set<string>();
  for (const folder of folders) {
    const manifest = join(folder, "package.json");
    if (!existsSync(manifest)) continue;
    const { scripts: own = {} } = JSON.parse(readFileSync(manifest, "utf8")) as { scripts?: Record<string, string> };
    for (const name of Object.keys(own)) scripts.add(name);
  }
  return {
    scripts,
    binaries: (name) => folders.some((f) => existsSync(join(f, "node_modules", ".bin", name))),
    file: (path) => folders.some((f) => existsSync(join(f, path))),
  };
};

const lacks = (need: Need, has: Holdings): string | undefined => {
  if (need.kind === "script")
    return has.scripts.has(need.name) ? undefined : `no package.json has the script ${need.name}`;
  if (need.kind === "binary")
    return has.binaries(need.name) ? undefined : `no node_modules/.bin has the binary ${need.name}`;
  return has.file(need.path) ? undefined : `the repository has no file ${need.path}`;
};

/** One line per command of a consolidated procedure that runs what the project no longer has. */
export const suspectsOf = (procedures: Map<string, Standing>, has: Holdings): string[] =>
  [...procedures].flatMap(([slug, { file, body }]) =>
    runsOf(body).flatMap(({ command, need }) => {
      const missing = lacks(need, has);
      return missing ? [`the procedure ${slug} (${file}) runs ${command} and ${missing}`] : [];
    }),
  );
