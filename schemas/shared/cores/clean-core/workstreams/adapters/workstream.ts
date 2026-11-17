import type { WorkstreamDeclaration } from "factory/sdk";
import { adapters } from "./adapters.rules.ts";

/** Resource adapters, built against the anti-corruption layers they implement; they fake nothing. */
export default { layers: (o) => [adapters(o)] } satisfies WorkstreamDeclaration;
