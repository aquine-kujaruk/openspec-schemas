#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { PACKAGE_ROOT, PROJECT_ROOT } from "./core/paths.ts";

const COMMANDS: Record<string, (args: string[]) => Promise<number>> = {
  check: async (args) => (await import("./architecture/check.ts")).check(args),
  generate: async (args) => (await import("./architecture/generate.ts")).generate(args),
  expect: async (args) => (await import("./architecture/expect.ts")).expect(args),
  test: async (args) => (await import("./architecture/test.ts")).test(args),
  validate: async (args) => (await import("./flow/validate.ts")).validate(args),
  schemas: async (args) => (await import("./repository/schemas.ts")).run(args),
  build: async (args) => (await import("./repository/build.ts")).run(args),
  doctor: async (args) => (await import("./package/doctor.ts")).run(args),
  guard: async (args) => (await import("./package/guard.ts")).run(args),
  gate: async (args) => (await import("./package/gate.ts")).run(args),
  implement: async (args) => (await import("./flow/implement.ts")).run(args),
  feedback: async (args) => (await import("./flow/feedback.ts")).run(args),
  verify: async (args) => (await import("./flow/verify.ts")).run(args),
  archive: async (args) => (await import("./flow/archive.ts")).run(args),
  proof: async (args) => (await import("./package/proof.ts")).run(args),
  openspec: async (args) => {
    const { runTool } = await import("./core/paths.ts");
    const env = { ...process.env, OPENSPEC_TELEMETRY: "0", DO_NOT_TRACK: "1" };
    return runTool("@fission-ai/openspec", args, { bin: "openspec", show: true, env }).status;
  },
  prepare: async () => {
    const [{ prepare }, { config }] = await Promise.all([
      import("./architecture/prepare.ts"),
      import("./architecture/project.ts"),
    ]);
    const created = prepare(PROJECT_ROOT, config);
    console.log(
      created.length ? created.map((d) => `created ${d}`).join("\n") : "nothing to prepare",
    );
    return 0;
  },
  review: async () => (await import("./architecture/review/cli.ts")).run(),
};

// archunit extends the matchers of a test runner it finds in the environment; the command is never one.
delete process.env.VITEST;

const [command, ...args] = process.argv.slice(2);
if (command === "--version" || command === "-v") {
  const manifest = JSON.parse(readFileSync(join(PACKAGE_ROOT, "package.json"), "utf8"));
  console.log((manifest as { version: string }).version);
  process.exit(0);
}
const run = command ? COMMANDS[command] : undefined;
if (!run) {
  console.error(
    `Unknown command: ${command ?? "(none)"}. Commands: ${Object.keys(COMMANDS).join(", ")}`,
  );
  process.exit(2);
}
process.exit(await run(args));
