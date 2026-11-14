import {
  existsSync,
  lstatSync,
  mkdirSync,
  readFileSync,
  realpathSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { dirname, join, relative } from "node:path";
import { parse, parseDocument } from "yaml";
import { DECISIONS, PROCEDURES } from "./consolidated.ts";
import { capture, COMMAND, INSTALLED, PROJECT_ROOT, SETUP_ASSETS } from "./paths.ts";
import type { Installed } from "./types.ts";

/** Where each agent reads what a package deploys for it. */
type Place = {
  skills: string;
  /** A rule file per instruction, or one instruction file the project may have written. */
  instruction: { rules: string } | { file: string };
  hooks: string;
};
export const PLACES: Record<string, Place> = {
  claude: {
    skills: ".claude/skills",
    instruction: { rules: ".claude/rules" },
    hooks: ".claude/settings.json",
  },
  codex: { skills: ".agents/skills", instruction: { file: "AGENTS.md" }, hooks: ".codex/hooks.json" },
};

/** The markers of the section the agent package manager manages in an instruction file. */
export const SECTION = { start: "<!-- apm:start -->", end: "<!-- apm:end -->" };

const SPECS = "openspec/specs";
const SCHEMAS = "openspec/schemas";
const CONFIG = "openspec/config.yaml";
const GUARDS = [`${COMMAND} guard`, `${COMMAND} gate`];

export type Item = {
  requirement: string;
  agent?: string;
  report: "missing" | "drift" | "repaired";
  detail: string;
};
export type Report = { items: Item[]; notes: string[]; status: 0 | 1 };

/** Something the flow needs and the project lacks; `repair` exists when the package owns it. */
type Lack = Omit<Item, "report"> & { drift?: true; repair?: () => void };

const text = (path: string): string | undefined =>
  existsSync(path) ? readFileSync(path, "utf8") : undefined;

/** What the installed package says about itself, read from the first agent that has its setup skill. */
export const readInstalled = (root: string): { installed: Installed; assets: string } | undefined => {
  for (const place of Object.values(PLACES)) {
    const assets = join(place.skills, SETUP_ASSETS);
    const record = text(join(root, assets, INSTALLED));
    if (record) return { installed: JSON.parse(record) as Installed, assets };
  }
  return undefined;
};

/** The version of the command the project depends on, as its lockfile records it. */
export const pinnedVersion = (root: string): string | undefined => {
  const manifest = JSON.parse(text(join(root, "package.json")) ?? "{}") as {
    devDependencies?: Record<string, string>;
  };
  const lock = text(join(root, "pnpm-lock.yaml"));
  if (!manifest.devDependencies?.[COMMAND] || !lock) return undefined;
  const { importers, packages } = parse(lock) as {
    importers?: Record<string, { devDependencies?: Record<string, { version: string }> }>;
    packages?: Record<string, { version?: string }>;
  };
  const resolved = importers?.["."]?.devDependencies?.[COMMAND]?.version;
  return resolved ? (packages?.[`${COMMAND}@${resolved}`]?.version ?? resolved) : undefined;
};

/** The instruction file with the package's instructions as its one managed section, the project's own lines kept. */
export const withSection = (own: string | undefined, instructions: string[]): string => {
  const section = `${SECTION.start}\n${instructions.join("\n\n")}\n${SECTION.end}`;
  const before = own ?? "";
  const start = before.indexOf(SECTION.start);
  const end = before.indexOf(SECTION.end);
  if (start !== -1 && end > start)
    return before.slice(0, start) + section + before.slice(end + SECTION.end.length);
  return `${before.trim() ? `${before.trimEnd()}\n\n` : ""}${section}\n`;
};

/** The link of `schema` under the project's schemas leads to that schema inside the installed command. */
export const schemaLinkHolds = (root: string, schema: string): boolean => {
  const link = join(root, SCHEMAS, schema);
  const inside = join(root, "node_modules", COMMAND, SCHEMAS, schema);
  return (
    existsSync(join(link, "schema.yaml")) &&
    existsSync(inside) &&
    realpathSync(link) === realpathSync(inside)
  );
};

/** The guard commands the hook file of `agent` does not call. */
export const unwiredGuards = (root: string, agent: string): string[] => {
  const wiring = text(join(root, PLACES[agent]?.hooks ?? "")) ?? "";
  return GUARDS.filter((guard) => !wiring.includes(guard));
};

const lacks = (root: string, installed: Installed, assets: string): Lack[] => {
  const found: Lack[] = [];
  const at = (path: string) => join(root, path);
  const run = (args: string[]) => {
    const r = capture("pnpm", args, { cwd: root });
    if (r.status !== 0) throw new Error(`pnpm ${args.join(" ")} failed:\n${r.stdout}\n${r.stderr}`);
  };

  const pinned = pinnedVersion(root);
  if (pinned !== installed.version)
    found.push({
      requirement: "the pinned command",
      detail: pinned
        ? `the skills name ${COMMAND} ${installed.version} and the project depends on ${pinned}`
        : `the project does not depend on ${COMMAND} ${installed.version}`,
      ...(pinned ? { drift: true as const } : {}),
      repair: () => run(["add", "-D", `./${join(assets, installed.command)}`]),
    });

  for (const schema of installed.schemas) {
    const link = at(join(SCHEMAS, schema));
    const inside = at(join("node_modules", COMMAND, SCHEMAS, schema));
    if (schemaLinkHolds(root, schema)) continue;
    const ownFolder = existsSync(link) && !lstatSync(link).isSymbolicLink();
    found.push({
      requirement: "a schema link",
      detail: ownFolder
        ? `${join(SCHEMAS, schema)} is a folder of the project: remove it so the schema of the installed command takes its place`
        : `${join(SCHEMAS, schema)} does not lead to the schema inside the installed command`,
      ...(ownFolder
        ? {}
        : {
            repair: () => {
              rmSync(link, { force: true });
              mkdirSync(dirname(link), { recursive: true });
              symlinkSync(relative(dirname(link), inside), link);
            },
          }),
    });
  }

  const config = text(at(CONFIG));
  if (typeof (parse(config ?? "") as { schema?: unknown } | null)?.schema !== "string")
    found.push({
      requirement: "the default schema",
      detail: `${CONFIG} names no schema`,
      repair: () => {
        const document = parseDocument(config ?? "");
        document.set("schema", installed.schemas[0]);
        mkdirSync(dirname(at(CONFIG)), { recursive: true });
        writeFileSync(at(CONFIG), String(document));
      },
    });

  const roots = [SPECS, DECISIONS, PROCEDURES].filter((dir) => !existsSync(at(dir)));
  if (roots.length)
    found.push({
      requirement: "the consolidated roots",
      detail: `${roots.join(", ")} ${roots.length > 1 ? "do" : "does"} not exist`,
      repair: () => {
        for (const dir of roots) {
          mkdirSync(at(dir), { recursive: true });
          writeFileSync(at(join(dir, ".gitkeep")), "");
        }
      },
    });

  const own = JSON.parse(text(at("package.json")) ?? "{}") as {
    dependencies?: Record<string, string>;
    devDependencies?: Record<string, string>;
  };
  const depends = (name: string) => name in { ...own.dependencies, ...own.devDependencies };
  const { testRunner, typeChecker } = installed.project;
  if (!depends(testRunner))
    found.push({
      requirement: "a test runner",
      detail: `add ${testRunner} to the project's development dependencies`,
    });
  if (!depends(typeChecker.name))
    found.push({
      requirement: "a type checker",
      detail: `add ${typeChecker.name} ${typeChecker.version} to the project's development dependencies`,
    });

  const instructions = Object.entries(installed.instructions);
  for (const agent of installed.agents) {
    const place = PLACES[agent];
    if (!place) {
      found.push({
        requirement: "the phase skills",
        agent,
        detail: `the command does not know where ${agent} reads its skills`,
      });
      continue;
    }
    const again = "install the package again with the agent package manager";
    const skills = installed.phases.filter(
      (phase) => !existsSync(at(join(place.skills, phase, "SKILL.md"))),
    );
    if (skills.length)
      found.push({
        requirement: "the phase skills",
        agent,
        detail: `${skills.join(", ")} not under ${place.skills}: ${again}`,
      });

    if ("rules" in place.instruction) {
      const rules = place.instruction.rules;
      const absent = instructions.filter(([name]) => !existsSync(at(join(rules, `${name}.md`))));
      if (absent.length)
        found.push({
          requirement: "the flow instruction",
          agent,
          detail: `${absent.map(([name]) => `${name}.md`).join(", ")} not under ${rules}: ${again}`,
        });
    } else {
      const file = place.instruction.file;
      const written = text(at(file));
      if (instructions.some(([, body]) => !written?.includes(body)))
        found.push({
          requirement: "the flow instruction",
          agent,
          detail: `${file} does not hold it`,
          repair: () => {
            writeFileSync(
              at(file),
              withSection(
                written,
                instructions.map(([, body]) => body),
              ),
            );
            const manifest = text(at("apm.yml"));
            if (!manifest) return;
            const document = parseDocument(manifest);
            document.setIn(["compilation", "agents_md"], {
              mode: "managed_section",
              start_marker: SECTION.start,
              end_marker: SECTION.end,
            });
            writeFileSync(at("apm.yml"), String(document));
          },
        });
    }

    if (installed.guards.length) {
      const unwired = unwiredGuards(root, agent);
      if (unwired.length)
        found.push({
          requirement: "the guards",
          agent,
          detail: `${place.hooks} does not call ${unwired.join(" or ")}: ${again}`,
        });
    }
  }
  return found;
};

/** What a person should know and no repair can settle. */
const notes = (root: string, installed: Installed): string[] => {
  const found: string[] = [];
  const { name, version } = installed.packageManager;
  const lock = parse(text(join(root, `${name}.lock.yaml`)) ?? "") as {
    apm_version?: string;
  } | null;
  if (lock?.apm_version && lock.apm_version !== version)
    found.push(
      `the package was installed with ${name} ${lock.apm_version} and built against ${version}`,
    );
  const pending = capture(name, ["approve", "--pending"], { cwd: root });
  if (pending.status === 0 && /unapproved/.test(pending.stdout))
    found.push(
      `${name} lists approvals as pending; review them with \`${name} approve --pending\``,
    );
  const { typeChecker } = installed.project;
  const have = text(join(root, "node_modules", typeChecker.name, "package.json"));
  const major = (v: string) => Number(v.split(".")[0]);
  if (have && major((JSON.parse(have) as { version: string }).version) < major(typeChecker.version))
    found.push(
      `${typeChecker.name} ${(JSON.parse(have) as { version: string }).version} is older than ${typeChecker.version}: the language server the package declares will not start`,
    );
  if (installed.guards.length && installed.agents.includes("codex"))
    found.push(
      "codex runs the guards only in a project it trusts and after each hook is reviewed with /hooks; review them again after every update that changes them",
    );
  return found;
};

/**
 * What the flow needs and the project lacks. With `fix`, what the package owns is repaired first
 * and only what is still lacking counts against the project.
 */
export const doctor = (root: string, { fix = false } = {}): Report | undefined => {
  const read = readInstalled(root);
  if (!read) return undefined;
  const { installed, assets } = read;
  const id = (lack: Lack) => `${lack.requirement}|${lack.agent ?? ""}|${lack.detail}`;
  const tried = new Map<string, Lack>();
  const failures = new Map<string, string>();
  // A repair changes what the next one stands on (the links lead into the pinned command), so each is diagnosed afresh.
  for (; fix; ) {
    const next = lacks(root, installed, assets).find((lack) => lack.repair && !tried.has(id(lack)));
    if (!next) break;
    tried.set(id(next), next);
    try {
      next.repair!();
    } catch (e) {
      failures.set(id(next), e instanceof Error ? e.message : String(e));
    }
  }
  const remaining = lacks(root, installed, assets);
  const still = new Set(remaining.map(id));
  const item = ({ repair: _repair, drift: _drift, ...rest }: Lack, report: Item["report"]): Item => ({
    ...rest,
    report,
  });
  const items = [
    ...[...tried].filter(([key]) => !still.has(key)).map(([, lack]) => item(lack, "repaired")),
    ...remaining.map((lack) => ({
      ...item(lack, lack.drift ? "drift" : "missing"),
      detail: failures.get(id(lack)) ?? lack.detail,
    })),
  ];
  return {
    items,
    notes: notes(root, installed),
    status: items.some((i) => i.report !== "repaired") ? 1 : 0,
  };
};

/**
 * `factory doctor [--fix]`: lists what the flow needs and the project lacks; `--fix` repairs what
 * the package owns. Exit status 0 when nothing is lacking, 1 when something is, 2 when no package
 * is installed.
 */
export const run = async (args: string[]): Promise<number> => {
  const report = doctor(PROJECT_ROOT, { fix: args.includes("--fix") });
  if (!report) {
    console.error(
      `no installed package found: install one with the agent package manager, so that an agent's skills hold ${join(SETUP_ASSETS, INSTALLED)}`,
    );
    return 2;
  }
  for (const item of report.items)
    console.log(
      `${item.report}: ${item.requirement}${item.agent ? ` for ${item.agent}` : ""} — ${item.detail}`,
    );
  if (!report.items.length) console.log("nothing is lacking");
  for (const note of report.notes) console.log(`note: ${note}`);
  return report.status;
};
