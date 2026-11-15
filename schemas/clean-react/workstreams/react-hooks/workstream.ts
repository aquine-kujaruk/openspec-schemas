import type { WorkstreamDeclaration } from "../../../../toolkit/core/types.ts";
import { framework } from "./framework.rules.ts";

/** The framework layer without its JSX: controllers, queries, mutations, view-models and stores. */
export default { layers: (o) => [framework(o)] } satisfies WorkstreamDeclaration;
