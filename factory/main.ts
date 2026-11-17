#!/usr/bin/env node
import {
  argumentsOf,
  cleanTestEnvironment,
  createHost,
  exit,
} from "./shared/infrastructure/adapters/cli.ts";
import { runCli } from "./shared/framework/cli.ts";
import { runtime } from "./shared/infrastructure/adapters/runtime.ts";
import {
  PACKAGE_ROOT,
  PROJECT_ROOT,
  SOURCE_EXT,
  runTool,
  capture,
} from "./shared/infrastructure/adapters/paths.ts";
import { createCommands as createRepositoryCommands } from "./repository/framework/commands.ts";
import { createCommands as createFlowCommands } from "./flow/framework/commands.ts";
import { createCommands as createArchitectureCommands } from "./architecture/framework/commands.ts";
import { createCommands as createPackageCommands } from "./package/framework/commands.ts";
cleanTestEnvironment();
const host = createHost(
  PACKAGE_ROOT,
  PROJECT_ROOT,
  SOURCE_EXT,
  async () =>
    (await import("./repository.ts")).products.projectProducts(PROJECT_ROOT),
  capture,
);
const commands = {
  ...createRepositoryCommands({
    schemas: async (args) =>
      (await import("./repository.ts")).commands.schemas!.run(args),
  }),
  ...createFlowCommands({
    implement: async (args) =>
      (await import("./flow.ts")).commands.implement!.run(args),
    handoff: async (args) =>
      (await import("./flow.ts")).commands.handoff!.run(args),
    reading: async (args) =>
      (await import("./flow.ts")).commands.reading!.run(args),
    feedback: async (args) =>
      (await import("./flow.ts")).commands.feedback!.run(args),
    verify: async (args) =>
      (await import("./flow.ts")).commands.verify!.run(args),
    archive: async (args) =>
      (await import("./flow.ts")).commands.archive!.run(args),
    validate: async (args) =>
      (await import("./flow.ts")).commands.validate!.run(args),
  }),
  ...createArchitectureCommands({
    check: async (args) =>
      (await import("./architecture.ts")).commands.check!.run(args),
    generate: async (args) =>
      (await import("./architecture.ts")).commands.generate!.run(args),
    test: async (args) =>
      (await import("./architecture.ts")).commands.test!.run(args),
    review: async (args) =>
      (await import("./architecture.ts")).commands.review!.run(args),
    prepare: async (args) =>
      (await import("./architecture.ts")).commands.prepare!.run(args),
  }),
  ...createPackageCommands({
    doctor: async (args) =>
      (await import("./package.ts")).commands.doctor!.run(args),
    guard: async (args) =>
      (await import("./package.ts")).commands.guard!.run(args),
    gate: async (args) =>
      (await import("./package.ts")).commands.gate!.run(args),
  }),
  openspec: {
    usage: "openspec <args…>: runs the specification tool",
    run: async (args: string[]) =>
      runTool("@fission-ai/openspec", args, {
        bin: "openspec",
        show: true,
        env: {
          ...runtime.environment(),
          OPENSPEC_TELEMETRY: "0",
          DO_NOT_TRACK: "1",
        },
      }).status,
  },
};
exit(await runCli(argumentsOf(), commands, host));
