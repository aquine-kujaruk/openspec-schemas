import type { WorkstreamDeclaration } from "../../../../../../toolkit/core/types.ts";
import { modules } from "./modules.rules.ts";

/** Reduce over app-domain and infrastructure: the rules that cut across modules and the whole core. */
export default { layers: (o) => [modules(o)] } satisfies WorkstreamDeclaration;
