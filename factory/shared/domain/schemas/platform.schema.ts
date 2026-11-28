import { z } from "zod";

export const PlatformSchema = z.object({ name: z.string(), all: z.array(z.string()), persistence: z.array(z.string()) });
export type Platform = z.infer<typeof PlatformSchema>;


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

export const PLATFORMS: Record<string, Platform> = { node, web };
