import type { Commands } from "../../shared/domain/command.ts";
export const createCommands = (
  handlers: Record<
    "check" | "generate" | "test" | "review" | "prepare",
    (args: string[]) => Promise<number>
  >,
): Commands => ({
  check: {
    usage:
      "check [--workstream <id>] [--product <name>]: checks the product's rules",
    run: handlers.check,
  },
  generate: {
    usage:
      "generate [--check] [--product <name>]: writes the acceptance tests generated from the specs",
    run: handlers.generate,
  },
  test: {
    usage:
      "test <acceptance|integration|unit|e2e> [--report <file>] [--product <name>]: runs the product's tests of one kind",
    run: handlers.test,
  },
  review: {
    usage:
      "review [--product <name>]: reviews the product against its schema's rubric",
    run: handlers.review,
  },
  prepare: {
    usage:
      "prepare [--product <name>]: creates the product's configured folders",
    run: handlers.prepare,
  },
});
