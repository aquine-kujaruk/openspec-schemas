import type { PackageManifest } from "../toolkit/core/types.ts";

const VERCEL = "1a2c79d4e6c4a2283dc2c614b6538cbe1ed5ca62";

/** A backend and a React frontend on the clean core, one product each, for Claude and Codex. */
export default {
  name: "fullstack",
  description: "The factory's phases over the clean-backend, clean-react and spec-plan schemas",
  schemas: ["clean-backend", "clean-react", "spec-plan"],
  agents: ["claude", "codex"],
  tools: {
    "@fission-ai/openspec": "2.0.0",
    archunit: "2.5.4",
    fallow: "3.34.1",
    feat2test: "4.0.0",
    "opsx-gherkin": "1.0.1",
    oxlint: "1.93.0",
    typescript: "6.0.3",
    yaml: "2.9.1",
  },
  skills: [
    { tool: "feat2test", path: "skills/gherkin-craft" },
    { tool: "opsx-gherkin", path: "skills/opsx-gherkin" },
    // The React workstreams read these; pinned at the commit the source vendored.
    { repository: "vercel-labs/agent-skills", commit: VERCEL, path: "skills/composition-patterns" },
    { repository: "vercel-labs/agent-skills", commit: VERCEL, path: "skills/web-design-guidelines" },
  ],
  languageServers: [
    {
      name: "typescript",
      command: "pnpm",
      args: ["exec", "tsc", "--lsp", "--stdio"],
      extensionToLanguage: { ".ts": "typescript", ".tsx": "typescriptreact" },
    },
  ],
  packageManager: { name: "apm", version: "0.35.1" },
  project: {
    testRunner: "vitest",
    typeChecker: { name: "typescript", version: "7.0.2" },
    // A web product's end-to-end tests (e2e-inc/e2e): the newest release two weeks old, and the Node it needs.
    e2e: { packages: { e2e: "0.22.0", "@e2e-dev/web": "0.15.4", "@e2e-dev/acp": "0.1.0" }, node: "22.22.3" },
  },
} satisfies PackageManifest;
