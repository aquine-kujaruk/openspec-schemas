import { defineFactory } from "factory";

/**
 * The factory is a line of this plant, manufactured with the clean-backend process: its modules are
 * the folders of factory/, its drawings live under openspec/specs/factory/<module>/<use-case>, and
 * what belongs to the rest of the repository (schemas, packages, tools, their tests) is ignored.
 */
export default defineFactory({
  modules: "factory/*",
  entry: ["factory/*.ts"],
  productSpecs: "openspec/specs/factory/*/*/spec.md",
  ignore: [
    "schemas/**",
    "packages/**",
    "tools/**",
    "openspec/**",
    "docs/**",
    "dist/**",
    "test/schemas/**",
  ],
});
