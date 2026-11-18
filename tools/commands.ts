import type { Command } from "../factory/shared/infrastructure/adapters/cli-contract.adapter.ts";
export const commands: Record<string, Command> = {
  build: {
    usage: "build <package> [--check]: builds the package",
    run: async (args) => (await import("./build.ts")).run(args),
  },
  release: {
    usage: "release [--push <remote>]: publishes every package",
    run: async (args) => (await import("./release.ts")).run(args),
  },
  proof: {
    usage: "proof [package]: proves a package in an empty project",
    run: async (args) => (await import("./proof.ts")).run(args),
  },
  expect: {
    usage: "expect [layer…] [--case Snn/name] [--changed] [--once]: records deterministic findings or refreshes rubric evidence. --changed reuses matching evidence. --once attempts one judgement per case.",
    run: async (args) => {
      await (await import("../factory/engineering.ts")).project.initialize();
      return (await import("./expect.ts")).expect(args);
    },
  },
};
