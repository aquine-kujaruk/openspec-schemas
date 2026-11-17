import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { basename, dirname, isAbsolute, join, relative, resolve } from "node:path";
import { PROJECT_ROOT } from "../core/paths.ts";
import { loadEnv } from "../architecture/review/env.ts";
import { readProjectConfig } from "../repository/products.ts";

/** An artifact to show the person, and the copy of it in their language that is shown instead. */
export type Reading = { source: string; copy: string; fresh: boolean };

/** Where to look, for a test: the environment and the system's temporary folder. */
export type ReadingOptions = { env?: NodeJS.ProcessEnv; tmp?: string };

/** The specification tool's folder: only what it keeps gets a reading copy. */
const KEPT = "openspec";

const sha = (text: string | Buffer): string => createHash("sha256").update(text).digest("hex");
const sidecar = (copy: string): string => `${copy}.source`;

/** The language the person reads in: their environment or `.env` first, then the project's; none for English. */
export const languageOf = async (root: string, env: NodeJS.ProcessEnv = process.env): Promise<string | undefined> => {
  const language = loadEnv(root, env).FACTORY_LANGUAGE?.trim() || (await readProjectConfig(root))?.language?.trim();
  return !language || /^en(?:[-_]|$)/i.test(language) ? undefined : language;
};

/** The path of `path` inside the project at `root`, refusing whatever lies outside `openspec/` or does not exist. */
const kept = (root: string, path: string): string => {
  const inside = relative(root, resolve(root, path));
  if (isAbsolute(inside) || inside.startsWith("..") || !inside.startsWith(`${KEPT}/`))
    throw new Error(`${path} is not an artifact of ${KEPT}/: only what the specification tool keeps gets a reading copy`);
  if (!existsSync(join(root, inside)) || !statSync(join(root, inside)).isFile())
    throw new Error(`${path} does not exist`);
  return inside;
};

/**
 * The reading copies of `paths` in the person's language, under the system's temporary folder at
 * `factory-reading/<language>/<project folder>-<hash of its path>/<path>`: never in the project.
 * A copy is stale when it is missing or its artifact changed since it was written. None when the
 * language is English or none is configured.
 */
export const readingsOf = async (root: string, paths: string[], { env = process.env, tmp = tmpdir() }: ReadingOptions = {}): Promise<Reading[]> => {
  const inside = paths.map((p) => kept(root, p));
  const language = await languageOf(root, env);
  if (!language) return [];
  const base = join(tmp, "factory-reading", language, `${basename(root)}-${sha(resolve(root)).slice(0, 8)}`);
  return inside.map((source) => {
    const copy = join(base, source);
    const fresh =
      existsSync(copy) &&
      existsSync(sidecar(copy)) &&
      readFileSync(sidecar(copy), "utf8").trim() === sha(readFileSync(join(root, source)));
    return { source, copy, fresh };
  });
};

/** Records that the copies of `paths` were written from their artifacts as they are now. */
export const markWritten = async (root: string, paths: string[], options: ReadingOptions = {}): Promise<Reading[]> => {
  const readings = await readingsOf(root, paths, options);
  for (const r of readings) {
    if (!existsSync(r.copy)) throw new Error(`the copy of ${r.source} was not written at ${r.copy}`);
    mkdirSync(dirname(r.copy), { recursive: true });
    writeFileSync(sidecar(r.copy), `${sha(readFileSync(join(root, r.source)))}\n`);
  }
  return readings.map((r) => ({ ...r, fresh: true }));
};

/** `factory reading [--written] <paths…>`, as lines and an exit status. */
export const reading = async (root: string, args: string[], options: ReadingOptions = {}): Promise<{ status: number; lines: string[] }> => {
  const paths = args.filter((a) => !a.startsWith("--"));
  if (!paths.length) return { status: 2, lines: ["Name the artifacts of openspec/ to show: factory reading [--written] <paths…>"] };
  try {
    const readings = args.includes("--written") ? await markWritten(root, paths, options) : await readingsOf(root, paths, options);
    if (!readings.length) return { status: 0, lines: ["no language other than English is configured: show the artifacts as they are"] };
    return { status: 0, lines: readings.map((r) => `${r.source} -> ${r.copy} ${r.fresh ? "fresh" : "stale"}`) };
  } catch (e) {
    return { status: 1, lines: [e instanceof Error ? e.message : String(e)] };
  }
};

export const run = async (args: string[]): Promise<number> => {
  const { status, lines } = await reading(PROJECT_ROOT, args);
  (status === 0 ? console.log : console.error)(lines.join("\n"));
  return status;
};
