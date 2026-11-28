import { z } from "zod";
import { PlantException } from "../exceptions/plant.exceptions.ts";
import { PLATFORMS } from "./platform.schema.ts";
import type { FactoryConfig, Platform } from "./line-types.schema.ts";

export type DeepPartial<T> = T extends readonly unknown[]
  ? T
  : T extends object
    ? { [K in keyof T]?: DeepPartial<T[K]> }
    : T;

export type Overrides = Omit<DeepPartial<FactoryConfig>, "platform"> & {
  platform?: string | Platform;
};

export type ProductEntry = Overrides & { root: string; schema: string };

export type ProjectConfig = Overrides & {
  schema?: string;
  products?: Record<string, ProductEntry>;
  implement?: { runner?: Runner };
  /** The language the agent shows the artifacts of `openspec/` in; `FACTORY_LANGUAGE` overrides it. */
  language?: string;
};

export const RunnerSchema = z.union([z.literal("session"), z.object({ command: z.string() })]);
export type Runner = z.infer<typeof RunnerSchema>;

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

  if (over.review && "modules" in over.review) {
    const { modules: _legacyRoot, ...review } = over.review;
    over.review = review;
  }

  const resolved = merge(defaults, project ? over : undefined) as FactoryConfig;

  return platform === undefined
    ? resolved
    : { ...resolved, platform: platformNamed(platform) };
};

const platformNamed = (platform: string | Platform): Platform => {
  if (typeof platform !== "string") return platform;
  const found = PLATFORMS[platform];

  if (!found)
    throw new PlantException(
      `no platform is called ${platform}; platforms: ${Object.keys(PLATFORMS).join(", ")}`,
    );

  return found;
};
