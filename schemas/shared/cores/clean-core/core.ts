import type { CoreDefinition, Vetoed } from "../../../../toolkit/core/types.ts";

/** The framework the core's counterexamples import to break no-framework-import: an HTTP delivery package. */
const standIn: Vetoed = {
  packages: ["express", "fastify", "koa", "hono", "@nestjs/common", "@nestjs/core"],
  patterns: ["express/*", "fastify/*", "koa/*", "hono/*", "@nestjs/*"],
};

/**
 * The clean core: Clean Architecture's domain, application, infrastructure and adapters, and the two
 * reduce workstreams that join them. It names no framework; a schema that names it adds one.
 */
export default {
  name: "clean-core",
  description:
    "Clean Architecture: domain and application, their infrastructure and adapters, the rules across modules and the whole product wired",
  workstreams: ["app-domain", "infrastructure", "adapters", "modules", "integrate"],
  // Map-reduce: the map workstreams in parallel, two reduce workstreams that integrate them.
  topology: {
    "app-domain": { dependsOn: [] },
    infrastructure: { dependsOn: [] },
    adapters: { dependsOn: [] },
    modules: { dependsOn: ["app-domain", "infrastructure", "adapters"] },
    integrate: { dependsOn: ["modules"] },
  },
  examples: { frameworks: { core: standIn, infrastructure: standIn } },
} satisfies CoreDefinition;
