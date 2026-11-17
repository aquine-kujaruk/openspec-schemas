import { existsSync } from "node:fs";
import type { Layer, Options } from "factory/sdk";

/** Unit tests mirror the domain or application file they prove. Spec: `openspec/specs/architecture/unit`. */
export const unit = (o: Options): Layer => ({
  name: "unit",
  fallow: {
    zones: [{ name: "unit", patterns: [`${o.unit}/**`] }],
    boundaries: [{ id: "unit-imports-only-the-core", from: "unit", allow: ["domain", "application"] }],
    forbiddenCalls: [],
  },
  oxlint: () => [{ files: [`${o.unit}/**`], rules: { "no-console": "off" } }],
  archunit: (ctx) => {
    const root = o.modules.replace(/\/\*$/, "");
    const escaped = o.unit.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const path = new RegExp(`^${escaped}/([^/]+)/((?:domain|application)/.+)\\.test\\.ts$`);
    return [{
      id: "unit-test-targets-core-file",
      title: `every unit test targets an existing core file: ${o.unit}/<module>/<path>.test.ts ↔ ${root}/<module>/<path>.ts`,
      check: () => ctx.files().inFolder(`${o.unit}/**`).should().adhereTo((f) => {
        const m = path.exec(f.path);
        return !!m && existsSync(`${root}/${m[1]}/${m[2]}.ts`);
      }, `[unit-test-targets-core-file] the path is ${o.unit}/<module>/<path>.test.ts, starts with domain/ or application/, and its core file exists in ${root}`).check(ctx.opts),
    }];
  },
});
