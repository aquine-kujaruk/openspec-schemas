#!/usr/bin/env node
import {
  argumentsOf,
  cleanTestEnvironment,
  createHost,
  exit,
} from "./shared/infrastructure/adapters/cli.adapter.ts";

import { runCli } from "./cli.ts";
import { runtime } from "./shared/infrastructure/adapters/runtime.adapter.ts";

import {
  PACKAGE_ROOT,
  PROJECT_ROOT,
  SOURCE_EXT,
  runTool,
  capture,
} from "./shared/infrastructure/adapters/paths.adapter.ts";

cleanTestEnvironment();

const host = createHost(
  PACKAGE_ROOT,
  PROJECT_ROOT,
  SOURCE_EXT,
  async () =>
    (await import("./engineering.ts")).products.projectProducts(PROJECT_ROOT),
  capture,
);

const commands = {
  schemas: {
    usage: "schemas [--json]: the schemas a change can be opened with, and the products the project declares",
    run: async (args: string[]) => (await import("./engineering.ts")).listProcessesCommand(args),
  },
  implement: {
    usage: "implement <change>: starts building the next phase of a ready change",
    run: async (args: string[]) => (await import("./production.ts")).startStage(args),
  },
  handoff: {
    usage: "handoff <change>: hands an approved, ready change to the runner the project configures",
    run: async (args: string[]) => (await import("./production.ts")).dispatchWorkOrder(args),
  },
  reading: {
    usage: "reading [--written] <paths…>: where to show artifacts of openspec/ in the person's language",
    run: async (args: string[]) => (await import("./production.ts")).makeReadingCopies(args),
  },
  feedback: {
    usage: "feedback <change> [raise|take …]: lists, raises or takes feedback on a change",
    run: async (args: string[]) => (await import("./production.ts")).pullAndon(args),
  },
  verify: {
    usage: "verify <change> [--proved <spec>]: runs every check and test and writes the evidence",
    run: async (args: string[]) => (await import("./quality.ts")).inspectWorkOrder(args),
  },
  archive: {
    usage: "archive [change]: archives the change, or every verified one, consolidating its specs",
    run: async (args: string[]) => (await import("./production.ts")).closeWorkOrders(args),
  },
  validate: {
    usage: "validate <change>: says whether the change is ready and, when not, every reason",
    run: async (args: string[]) => (await import("./production.ts")).validateWorkOrder(args),
  },
  check: {
    usage: "check [--workstream <id>] [--product <name>]: checks the product's rules",
    run: async (args: string[]) => (await import("./quality.ts")).runQualityControl(args),
  },
  generate: {
    usage: "generate [--check] [--product <name>]: writes the acceptance tests generated from the specs",
    run: async (args: string[]) => (await import("./quality.ts")).makeGauges(args),
  },
  test: {
    usage: "test <acceptance|integration|unit|e2e> [--report <file>] [--product <name>]: runs the product's tests of one kind",
    run: async (args: string[]) => (await import("./quality.ts")).runGauges(args),
  },
  review: {
    usage: "review [--product <name>]: reviews the product against its schema's rubric",
    run: async () => (await import("./quality.ts")).audit(),
  },
  prepare: {
    usage: "prepare [--product <name>]: creates the product's configured folders",
    run: async () => (await import("./engineering.ts")).prepareLineCommand(),
  },
  doctor: {
    usage: "doctor [--fix]: lists what the flow needs and the project lacks",
    run: async (args: string[]) => (await import("./maintenance.ts")).maintainEquipment(args),
  },
  guard: {
    usage: "guard [path…]: judges a write an agent is about to make",
    run: async (args: string[]) => (await import("./change-control.ts")).authorizeWrite(args),
  },
  gate: {
    usage: "gate [--helper]: judges an agent's attempt to finish",
    run: async (args: string[]) => (await import("./quality.ts")).holdStage(args),
  },
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
