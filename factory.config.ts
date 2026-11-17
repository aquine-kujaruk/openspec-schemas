import { defineFactory } from "factory";

/**
 * The factory itself is the product: a clean-backend whose modules are the folders of factory/,
 * one per area of openspec/specs. The checker is the command pinned from the setup skill's tarball, not this code.
 */
export default defineFactory({
  modules: "factory/*",
  productSpecs: "openspec/specs/*/*/spec.md",
});
