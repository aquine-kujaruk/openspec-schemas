import type { FactoryConfig } from "./types.ts";

/** Every key optional at every depth: a project configuration sets only what it changes. */
export type DeepPartial<T> = T extends readonly unknown[]
  ? T
  : T extends object
    ? { [K in keyof T]?: DeepPartial<T[K]> }
    : T;

/** One product of a project: its folder, its schema, and what it sets over the project's configuration. */
export type ProductEntry = DeepPartial<FactoryConfig> & { root: string; schema: string };

/**
 * What `factory.config.ts` exports: what a project sets over its schema's defaults, which schema
 * that is when it has several that build product code, and the products it declares by folder.
 */
export type ProjectConfig = DeepPartial<FactoryConfig> & {
  schema?: string;
  products?: Record<string, ProductEntry>;
};

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
  const { schema: _schema, products: _products, ...over } = project ?? {};
  return merge(defaults, project ? over : undefined) as FactoryConfig;
};
