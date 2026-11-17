import type { FeedbackPorts } from "../domain/feedback.ts";
const options = (args: string[], name: string): string[] =>
  args.flatMap((a, i) =>
    a === name && args[i + 1] !== undefined ? [args[i + 1]!] : [],
  );

/** Receives the invocation and presents the application's result. */
export const createFeedbackCommand =
  ({
    join,
    activeChanges,
    PROJECT_ROOT,
    SOURCES,
    raised,
    raise,
    takeIn,
  }: FeedbackPorts &
    Omit<
      typeof import("../domain/feedback.ts"),
      "run"
    >): (typeof import("../domain/feedback.ts"))["run"] =>
  async (args: string[]): Promise<number> => {
    const [change, action] = args;
    const known = activeChanges(PROJECT_ROOT);
    if (!change || !known.includes(change)) {
      console.error(
        `Name the change the feedback is about. Changes: ${known.join(", ") || "none"}`,
      );
      return 2;
    }
    const [from] = options(args, "--from");
    const [says] = options(args, "--says");
    if (!action) {
      const pending = raised(PROJECT_ROOT, change);
      for (const r of pending)
        console.log(
          `${r.source} about ${r.names}:\n${r.findings.map((f) => `  ${f.split("\n").join("\n  ")}`).join("\n")}`,
        );
      if (!pending.length) console.log("no feedback is waiting to be taken in");
      return 0;
    }
    if (
      !["raise", "take"].includes(action) ||
      !from ||
      !says ||
      !SOURCES.includes(from as never)
    ) {
      console.error(
        `Say what to do with the feedback: raise or take, with --from (one of: ${SOURCES.join(", ")}) and --says.`,
      );
      return 2;
    }
    if (action === "raise") {
      raise(PROJECT_ROOT, change, {
        source: from,
        names: options(args, "--names")[0] ?? change,
        findings: [says],
      });
      console.log(`raised: ${from} about ${change}`);
      return 0;
    }
    const [phase] = options(args, "--phase");
    takeIn(PROJECT_ROOT, change, {
      source: from,
      says,
      phase: phase === undefined ? undefined : Number(phase),
      questions: options(args, "--ask"),
    });
    console.log(`taken in: ${from} about ${change}`);
    return 0;
  };
