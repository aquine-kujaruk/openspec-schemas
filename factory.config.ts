import { defineFactory } from "factory";

/**
 * The factory itself is the product: a clean-backend whose modules are the folders of factory/,
 * whose use cases are specified under openspec/specs/factory/<module>/<use-case>. The checker is the command pinned from the setup skill's tarball, not this code.
 */
export default defineFactory({
  modules: "factory/*",
  productSpecs: "openspec/specs/factory/*/*/spec.md",
});
