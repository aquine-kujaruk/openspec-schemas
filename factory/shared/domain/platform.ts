import type { Platform } from "./types.ts";

/**
 * The platforms a schema or a project can pick. The only place that knows which globals reach the
 * environment: the layers receive these lists from the platform the configuration names.
 */

/** Node platform (a server process). */
export const node: Platform = {
  name: "node",
  all: [
    "process",
    "fetch",
    "WebSocket",
    "navigator",
    "localStorage",
    "sessionStorage",
  ],
  persistence: ["fetch", "WebSocket", "localStorage", "sessionStorage"],
};

/**
 * Web platform (a browser). Persisted state and the network belong to adapters; navigating
 * (`location`, `history`, `window.open`) belongs to whoever the schema lets navigate.
 */
export const web: Platform = {
  name: "web",
  all: [
    "window",
    "document",
    "localStorage",
    "sessionStorage",
    "navigator",
    "location",
    "history",
    "fetch",
  ],
  persistence: ["localStorage", "sessionStorage", "navigator", "fetch"],
};

/** Every platform, by the name a configuration gives it. */
export const PLATFORMS: Record<string, Platform> = { node, web };
