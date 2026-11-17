import type { Commands } from "../../shared/domain/command.ts";
export const createCommands = (
  handlers: Record<
    | "implement"
    | "handoff"
    | "reading"
    | "feedback"
    | "verify"
    | "archive"
    | "validate",
    (args: string[]) => Promise<number>
  >,
): Commands => ({
  implement: {
    usage:
      "implement <change>: starts building the next phase of a ready change",
    run: handlers.implement,
  },
  handoff: {
    usage:
      "handoff <change>: hands an approved, ready change to the runner the project configures",
    run: handlers.handoff,
  },
  reading: {
    usage:
      "reading [--written] <paths…>: where to show artifacts of openspec/ in the person's language",
    run: handlers.reading,
  },
  feedback: {
    usage:
      "feedback <change> [raise|take …]: lists, raises or takes feedback on a change",
    run: handlers.feedback,
  },
  verify: {
    usage:
      "verify <change> [--proved <spec>]: runs every check and test and writes the evidence",
    run: handlers.verify,
  },
  archive: {
    usage:
      "archive [change]: archives the change, or every verified one, consolidating its specs",
    run: handlers.archive,
  },
  validate: {
    usage:
      "validate <change>: says whether the change is ready and, when not, every reason",
    run: handlers.validate,
  },
});
