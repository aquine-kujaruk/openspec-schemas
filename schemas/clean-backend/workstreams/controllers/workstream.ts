import type { WorkstreamDeclaration } from "factory/sdk";
import { controllers } from "./controllers.rules.ts";

/** The optional delivery layer of a backend: one controller per module that composes its use cases. A backend without controllers breaks none of its rules. */
export default { layers: (o) => [controllers(o)] } satisfies WorkstreamDeclaration;
