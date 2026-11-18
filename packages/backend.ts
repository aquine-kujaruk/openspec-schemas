import type { PackageManifest } from "factory/sdk";

/** Clean Architecture for a backend, for Claude and Codex. */
export default {
  name: "backend",
  description: "The factory's phases over the clean-backend and spec-plan schemas",
  schemas: ["clean-backend", "spec-plan"],
  agents: ["claude", "codex"],
  tools: {
    "@cucumber/gherkin": "42.0.1",
    "@fission-ai/openspec": "2.0.0",
    archunit: "2.5.4",
    fallow: "3.34.1",
    feat2test: "4.0.0",
    "opsx-gherkin": "1.0.1",
    oxlint: "1.93.0",
    typescript: "6.0.3",
    yaml: "2.9.1",
    zod: "4.6.7",
  },
  skills: [
    { tool: "feat2test", path: "skills/gherkin-craft" },
    { tool: "opsx-gherkin", path: "skills/opsx-gherkin" },
  ],
  languageServers: [
    {
      name: "typescript",
      command: "pnpm",
      args: ["exec", "tsc", "--lsp", "--stdio"],
      extensionToLanguage: { ".ts": "typescript" },
    },
  ],
  packageManager: { name: "apm", version: "0.35.1" },
  project: { testRunner: "vitest", typeChecker: { name: "typescript", version: "7.0.2" } },
} satisfies PackageManifest;
