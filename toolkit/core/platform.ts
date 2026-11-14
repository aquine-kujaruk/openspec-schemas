import type { Platform } from "./types.ts";

/**
 * Node platform (a server process). The only place that knows which globals reach the environment:
 * the layers receive these lists from the schema that picks the platform.
 */
export const node: Platform = {
  name: "node",
  all: ["process", "fetch", "WebSocket", "navigator", "localStorage", "sessionStorage"],
  persistence: ["fetch", "WebSocket", "localStorage", "sessionStorage"],
};
