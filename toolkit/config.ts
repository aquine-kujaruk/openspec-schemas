import type { FactoryConfig } from "./types.ts";

/** Every key optional at every depth: a project configuration sets only what it changes. */
export type DeepPartial<T> = T extends readonly unknown[]
  ? T
  : T extends object
    ? { [K in keyof T]?: DeepPartial<T[K]> }
    : T;

/** What `factory.config.ts` exports. */
/** What a project sets over its schema's defaults, and which schema that is when it has several that build product code. */
export type ProjectConfig = DeepPartial<FactoryConfig> & { schema?: string };

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
export const resolveConfig = (defaults: FactoryConfig, project?: ProjectConfig): FactoryConfig => {
  const { schema: _schema, ...over } = project ?? {};
  return merge(defaults, project ? over : undefined) as FactoryConfig;
};
