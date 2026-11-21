import type { WorkstreamDeclaration } from "factory/sdk";
import { framework } from "./framework.rules.ts";
import { ui } from "./ui.rules.ts";

/**
 * The React framework: the JSX (pages, components, bridges, the entry) and the layer without it
 * (controllers, queries, mutations, view-models, stores). It builds the screens against stub
 * controllers first, and later replaces each stub with the real controller over the core's seams.
 */
export default { layers: (o) => [ui(o), framework(o)] } satisfies WorkstreamDeclaration;
