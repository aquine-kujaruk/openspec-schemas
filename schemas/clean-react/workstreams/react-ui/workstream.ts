import type { WorkstreamDeclaration } from "../../../../toolkit/core/types.ts";
import { ui } from "./ui.rules.ts";

/** The JSX layer: pages and components, bridges and the entry; its seam is the controller each page destructures. */
export default { layers: (o) => [ui(o)] } satisfies WorkstreamDeclaration;
