import type { CoreDefinition, Vetoed } from "../../../../toolkit/core/types.ts";
import { wholeProduct } from "./checks.ts";

/** The framework the core's counterexamples import to break no-framework-import: an HTTP delivery package. */
const standIn: Vetoed = {
  packages: ["express", "fastify", "koa", "hono", "@nestjs/common", "@nestjs/core"],
  patterns: ["express/*", "fastify/*", "koa/*", "hono/*", "@nestjs/*"],
};

/**
 * The clean core: Clean Architecture's domain, application, infrastructure and adapters, and the
 * reduce workstream that holds the rules across modules. Its workstreams stay decoupled: verify runs
 * the whole-product checks that prove they work together. It names no framework; a schema that
 * names it adds one.
 */
export default {
  name: "clean-core",
  description:
    "Clean Architecture: domain and application, their infrastructure and adapters, and the rules across modules",
  workstreams: ["app-domain", "infrastructure", "adapters", "modules"],
  // Map-reduce: the map workstreams in parallel, one reduce workstream over them.
  topology: {
    "app-domain": { dependsOn: [] },
    infrastructure: { dependsOn: [] },
    adapters: { dependsOn: [] },
    modules: { dependsOn: ["app-domain", "infrastructure", "adapters"] },
  },
  checks: wholeProduct,
  examples: { frameworks: { core: standIn, infrastructure: standIn } },
} satisfies CoreDefinition;
