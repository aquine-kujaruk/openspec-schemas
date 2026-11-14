import { existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import type { Options } from "./types.ts";

/** The base laid under a new module root when the configuration declares none. */
export const DEFAULT_BASE = ["shared/domain", "shared/application", "shared/infrastructure"];

type Roots = Pick<Options, "modules" | "acceptance" | "integration" | "base">;

/**
 * `factory prepare`: the minimum the implementer needs before any workstream. Every configured
 * root that does not exist is created; a new module root also gets the configured `base` (or
 * `DEFAULT_BASE`). An existing directory is never touched, so running it twice changes nothing.
 * Returns the directories it created, relative to `cwd`.
 */
export const prepare = (cwd: string, o: Roots): string[] => {
  const created: string[] = [];
  const make = (dir: string) => {
    if (existsSync(join(cwd, dir))) return;
    mkdirSync(join(cwd, dir), { recursive: true });
    created.push(dir);
  };
  const moduleRoot = o.modules.replace(/\/\*$/, "");
  if (!existsSync(join(cwd, moduleRoot))) {
    make(moduleRoot);
    for (const dir of o.base ?? DEFAULT_BASE) make(`${moduleRoot}/${dir}`);
  }
  make(o.acceptance);
  make(o.integration);
  return created;
};
