#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { PACKAGE_ROOT, PROJECT_ROOT } from "./core/paths.ts";

/** What each command does and takes, printed by `factory help` and `factory <command> --help`. */
const USAGE = {
  check: "check [--workstream <id>] [--product <name>]: checks the product's rules",
  generate: "generate [--check] [--product <name>]: writes the acceptance tests generated from the specs",
  expect: "expect: writes what each example case of the rules reports (only in this repository)",
  test: "test <acceptance|integration> [--report <file>] [--product <name>]: runs the product's tests of one kind",
  validate: "validate <change>: says whether the change is ready and, when not, every reason",
  schemas: "schemas [--json]: the schemas a change can be opened with, and the products the project declares",
  build: "build <package> [--check]: builds the package into dist/<package>",
  doctor: "doctor [--fix]: lists what the flow needs and the project lacks",
  guard: "guard [path…]: judges a write an agent is about to make",
  gate: "gate [--helper]: judges an agent's attempt to finish",
  implement: "implement <change>: starts building the next phase of a ready change",
  handoff: "handoff <change>: hands an approved, ready change to the runner the project configures",
  reading: "reading [--written] <paths…>: where to show artifacts of openspec/ in the person's language",
  feedback: "feedback <change> [raise|take …]: lists, raises or takes feedback on a change",
  verify: "verify <change> [--proved <spec>]: runs every check and test and writes the evidence",
  archive: "archive [change]: archives the change, or every verified one, consolidating its specs",
  proof: "proof [package]: builds the package and proves it in an empty project",
  release: "release [--push <remote>]: publishes every package under packages-v<version>",
  openspec: "openspec <args…>: runs the specification tool",
  prepare: "prepare [--product <name>]: creates the product's configured folders",
  review: "review [--product <name>]: reviews the product against its schema's rubric",
} satisfies Record<string, string>;

type Command = keyof typeof USAGE;

const COMMANDS: Record<Command, (args: string[]) => Promise<number>> = {
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
  handoff: async (args) => (await import("./flow/handoff.ts")).run(args),
  reading: async (args) => (await import("./flow/reading.ts")).run(args),
  feedback: async (args) => (await import("./flow/feedback.ts")).run(args),
  verify: async (args) => (await import("./flow/verify.ts")).run(args),
  archive: async (args) => (await import("./flow/archive.ts")).run(args),
  proof: async (args) => (await import("./package/proof.ts")).run(args),
  release: async (args) => (await import("./repository/release.ts")).run(args),
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

const usage = (only?: string): string =>
  (only ? [USAGE[only as Command]] : Object.values(USAGE)).map((line) => `factory ${line}`).join("\n");

// archunit extends the matchers of a test runner it finds in the environment; the command is never one.
delete process.env.VITEST;

/** The commands that work on one product: in a project with several and none named, they run once per product. */
const PER_PRODUCT = new Set(["check", "generate", "test", "prepare", "review"]);

const [command, ...given] = process.argv.slice(2);
const at = given.indexOf("--product");
const args = at === -1 ? given : given.filter((_, i) => i !== at && i !== at + 1);
const { PRODUCT_VARIABLE } = await import("./repository/products.ts");
if (at !== -1) {
  if (!given[at + 1]) {
    console.error("--product needs the name of a product");
    process.exit(2);
  }
  process.env[PRODUCT_VARIABLE] = given[at + 1];
}
if (command === "--version" || command === "-v") {
  const manifest = JSON.parse(readFileSync(join(PACKAGE_ROOT, "package.json"), "utf8"));
  console.log((manifest as { version: string }).version);
  process.exit(0);
}
// Help never runs a command: `archive` with no change would archive every verified one.
if (command === "help" || command === "--help" || command === "-h") {
  console.log(usage(given[0] && given[0] in USAGE ? given[0] : undefined));
  process.exit(0);
}
if (command && command !== "openspec" && command in USAGE && args.some((a) => a === "--help" || a === "-h")) {
  console.log(usage(command));
  process.exit(0);
}
const run = command && command in COMMANDS ? COMMANDS[command as Command] : undefined;
if (!run) {
  console.error(
    `Unknown command: ${command ?? "(none)"}. Commands:\n${usage()}`,
  );
  process.exit(2);
}
if (command && PER_PRODUCT.has(command) && !process.env[PRODUCT_VARIABLE]) {
  const { projectProducts } = await import("./repository/products.ts");
  const products = await projectProducts(PROJECT_ROOT);
  if (products.length > 1) {
    const { capture, SOURCE_EXT } = await import("./core/paths.ts");
    let status = 0;
    const failing: string[] = [];
    for (const { name } of products) {
      console.log(`\n■ product ${name}`);
      const r = capture(process.execPath, [join(PACKAGE_ROOT, "toolkit", `cli${SOURCE_EXT}`), command, ...args], {
        cwd: PROJECT_ROOT,
        env: { ...process.env, [PRODUCT_VARIABLE]: name },
        show: true,
      });
      status = Math.max(status, r.status);
      if (r.status !== 0) failing.push(name);
    }
    console.log(failing.length ? `\nfailing products: ${failing.join(", ")}` : "\nevery product passes");
    process.exit(status);
  }
}
process.exit(await run(args));
