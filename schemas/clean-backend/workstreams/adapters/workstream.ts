import type { WorkstreamDeclaration } from "../../../../toolkit/core/types.ts";
import { adapters } from "./adapters.rules.ts";

/** Resource adapters, built against the anti-corruption layers they implement; they fake nothing. */
export default { layers: (o) => [adapters(o)] } satisfies WorkstreamDeclaration;
