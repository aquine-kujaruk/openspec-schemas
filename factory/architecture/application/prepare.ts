import type { Options } from "../../shared/domain/types.ts";
import type { PreparePorts } from "../domain/prepare.ts";

/** Builds these use cases from their capabilities; importing them touches no resources. */
export const createPrepare = ({
  existsSync,
  mkdirSync,
  join,
}: PreparePorts): typeof import("../domain/prepare.ts") => {
  /** The base laid under a new module root when the configuration declares none. */
  const DEFAULT_BASE = [
    "shared/domain",
    "shared/application",
    "shared/infrastructure",
  ];

  type Roots = Pick<Options, "modules" | "acceptance" | "integration" | "base">;

  /**
   * `factory prepare`: the minimum the implementer needs before any workstream. Every configured
   * root that does not exist is created; a new module root also gets the configured `base` (or
   * `DEFAULT_BASE`). An existing directory is never touched, so running it twice changes nothing.
   * Returns the directories it created, relative to `cwd`.
   */
  const prepare = (cwd: string, o: Roots): string[] => {
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
  return { DEFAULT_BASE, prepare };
};
