import { NeedKind, type EquipmentHoldings, type EquipmentProcedure, type ProcedureNeed, type ProcedureRun } from "../schemas/procedure-reading.schema.ts";

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

export class SuspectProcedureService {
  /** The code of a procedure's body: each line of its fenced blocks and each inline code span. */
  codeOf(body: string): string[] {
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
  }

  /** A token that names something only known when the command runs: a variable, a placeholder, a glob. */
  private unknown(token: string): boolean {
    return /[$<>{}*`]/.test(token);
  }

  private unquote(token: string): string {
    return token.replace(/^["']|["']$/g, "");
  }

  /** What one simple command (no `&&`, `|` or `;`) needs, when it is one doctor can judge. */
  private needOf(words: string[]): ProcedureNeed | undefined {
    const tokens = words.map((word) => this.unquote(word));
    // Leading variable assignments (`PORT=3000 pnpm dev`) set the environment and run nothing.
    while (tokens[0] && /^\w+=/.test(tokens[0])) tokens.shift();
    const [head, first, second] = tokens;
    if (!head || tokens.slice(0, 3).some((t) => t && this.unknown(t)))
      return undefined;
    const script = (name?: string): ProcedureNeed | undefined =>
      name && !name.startsWith("-") ? { kind: NeedKind.Script, name } : undefined;
    if (head === "pnpm") {
      if (first === "run" || first === "run-script") return script(second);
      if (first === "exec")
        return second && !second.startsWith("-")
          ? { kind: NeedKind.Binary, name: second }
          : undefined;
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
      if (!first || first.startsWith("-") || first.lastIndexOf("@") > 0)
        return undefined;
      return { kind: NeedKind.Binary, name: first };
    }
    if (INTERPRETERS.has(head))
      return first && !first.startsWith("-")
        ? { kind: NeedKind.File, path: first }
        : undefined;
    if (head.startsWith("./")) return { kind: NeedKind.File, path: head };
    return undefined;
  }

  /** The commands a procedure's body runs that doctor can judge. */
  runsOf(body: string): ProcedureRun[] {
    return this.codeOf(body).flatMap((code) =>
      code
        .replace(/^\s*\$\s+/, "")
        .split(/&&|\|\||;|\|/)
        .map((part) => part.trim().split(/\s+/).filter(Boolean))
        .flatMap((words) => {
          const need = this.needOf(words);
          return need ? [{ command: words.join(" "), need }] : [];
        }),
    );
  }
  private lacks(need: ProcedureNeed, has: EquipmentHoldings): string | undefined {
    if (need.kind === NeedKind.Script)
      return has.scripts.has(need.name)
        ? undefined
        : `no package.json has the script ${need.name}`;
    if (need.kind === NeedKind.Binary)
      return has.binaries(need.name)
        ? undefined
        : `no node_modules/.bin has the binary ${need.name}`;
    return has.file(need.path)
      ? undefined
      : `the repository has no file ${need.path}`;
  }

  /** One line per command of a consolidated procedure that runs what the project no longer has. */
  suspectsOf(
    procedures: Map<string, EquipmentProcedure>,
    has: EquipmentHoldings,
  ): string[] {
    return [...procedures].flatMap(([slug, { file, body }]) =>
      this.runsOf(body).flatMap(({ command, need }) => {
        const missing = this.lacks(need, has);
        return missing
          ? [`the procedure ${slug} (${file}) runs ${command} and ${missing}`]
          : [];
      }),
    );
  }
}
