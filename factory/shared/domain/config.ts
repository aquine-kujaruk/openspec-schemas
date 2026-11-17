import { PLATFORMS } from "./platform.ts";
import type { FactoryConfig, Platform } from "./types.ts";

/** Every key optional at every depth: a project configuration sets only what it changes. */
export type DeepPartial<T> = T extends readonly unknown[]
  ? T
  : T extends object
    ? { [K in keyof T]?: DeepPartial<T[K]> }
    : T;

/** What a configuration sets over the defaults; a platform may be named (`"web"`) or given whole. */
export type Overrides = Omit<DeepPartial<FactoryConfig>, "platform"> & {
  platform?: string | Platform;
};

/** One product of a project: its folder, its schema, and what it sets over the project's configuration. */
export type ProductEntry = Overrides & { root: string; schema: string };

/**
 * What `factory.config.ts` exports: what a project sets over its schema's defaults, which schema
 * that is when it has several that build product code, and the products it declares by folder.
 */
export type ProjectConfig = Overrides & {
  schema?: string;
  products?: Record<string, ProductEntry>;
  /** Where an approved change is built. */
  implement?: { runner?: Runner };
  /** The language the agent shows the artifacts of `openspec/` in; `FACTORY_LANGUAGE` overrides it. */
  language?: string;
};

/**
 * Where an approved change is built: `"session"`, the same session through the implement phase, or
 * a shell command that receives the change's name in place of `{change}` and takes it wherever it
 * runs.
 */
export type Runner = "session" | { command: string };

/** Types a project configuration without changing it: `export default defineFactory({ ... })`. */
export const defineFactory = (c: ProjectConfig): ProjectConfig => c;

const isSection = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);

const merge = (base: unknown, over: unknown): unknown => {
  if (over === undefined) return base;
  if (!isSection(base) || !isSection(over)) return over;
  const out: Record<string, unknown> = { ...base };
  for (const [k, v] of Object.entries(over)) out[k] = merge(base[k], v);
  return out;
};

/**
 * The project configuration over the defaults: a value it sets replaces the default (arrays
 * included), a section it sets is merged key by key, and whatever it leaves out keeps its default.
 * Without a project configuration, the defaults as they are.
 */
export const resolveConfig = (
  defaults: FactoryConfig,
  project?: ProjectConfig,
): FactoryConfig => {
  const {
    schema: _schema,
    products: _products,
    implement: _implement,
    language: _language,
    platform,
    ...over
  } = project ?? {};
  const resolved = merge(defaults, project ? over : undefined) as FactoryConfig;
  return platform === undefined
    ? resolved
    : { ...resolved, platform: platformNamed(platform) };
};

/** The platform a configuration names, or gives whole. */
const platformNamed = (platform: string | Platform): Platform => {
  if (typeof platform !== "string") return platform;
  const found = PLATFORMS[platform];
  if (!found)
    throw new Error(
      `no platform is called ${platform}; platforms: ${Object.keys(PLATFORMS).join(", ")}`,
    );
  return found;
};
