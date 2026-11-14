import type { WorkstreamDeclaration } from "../../../../toolkit/types.ts";
import { infrastructure } from "./infrastructure.rules.ts";
import { integration } from "./integration.rules.ts";

/** Repository implementations and anti-corruption layers, and their integration tests over in-memory adapters typed by the ACLs. */
export default {
  layers: (o) => [infrastructure(o), integration(o)],
  tests: ["integration"],
} satisfies WorkstreamDeclaration;
