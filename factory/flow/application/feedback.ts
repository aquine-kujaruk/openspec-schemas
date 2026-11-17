import type { Raised, Taken } from "../domain/feedback.ts";
import type { FeedbackPorts } from "../domain/feedback.ts";

/** Builds these use cases from their capabilities; importing them touches no resources. */
export const createFeedback = ({
  existsSync,
  readFileSync,
  rmSync,
  writeFileSync,
  join,
  activeChanges,
  CHANGES,
  GATE,
  PROJECT_ROOT,
}: FeedbackPorts): Omit<typeof import("../domain/feedback.ts"), "run"> => {
  /** Who raises feedback about a change. */
  const SOURCES = [
    "the person",
    "the completion gate",
    "the verify phase",
    "the archive",
    "the implement phase",
  ] as const;

  /** Feedback a phase or a guard raised and the feedback phase has not taken in yet. */

  /** Feedback as it is taken in: what it says, the phase it invalidates, and what only the person can decide. */

  const RAISED = "feedback.json";

  const folder = (root: string, change: string) => join(root, CHANGES, change);

  const raised = (root: string, change: string): Raised[] => {
    const path = join(folder(root, change), RAISED);
    return existsSync(path)
      ? (JSON.parse(readFileSync(path, "utf8")) as Raised[])
      : [];
  };

  /** Records feedback about `change` for the feedback phase to take in. */
  const raise = (root: string, change: string, feedback: Raised): void => {
    const all = [
      ...raised(root, change).filter(
        (r) => r.source !== feedback.source || r.names !== feedback.names,
      ),
      feedback,
    ];
    writeFileSync(
      join(folder(root, change), RAISED),
      `${JSON.stringify(all, null, 2)}\n`,
    );
  };

  /** The lines of `## <title>`: from the line after its heading up to the next heading of its level or above. */
  const section = (
    lines: string[],
    title: string,
  ): { start: number; end: number } | undefined => {
    const at = lines.findIndex(
      (l) => l.trim().toLowerCase() === `## ${title}`.toLowerCase(),
    );
    if (at === -1) return undefined;
    const next = lines.findIndex((l, i) => i > at && /^#{1,2} /.test(l));
    return { start: at + 1, end: next === -1 ? lines.length : next };
  };

  /** Adds `items` at the end of `## <title>`, creating the section before `## <before>` when the plan lacks it. */
  const append = (
    lines: string[],
    title: string,
    items: string[],
    before: string,
  ): void => {
    if (!items.length) return;
    let found = section(lines, title);
    if (!found) {
      const anchor = lines.findIndex(
        (l) => l.trim().toLowerCase() === `## ${before}`.toLowerCase(),
      );
      const at = anchor === -1 ? lines.length : anchor;
      lines.splice(at, 0, `## ${title}`, "", "");
      found = section(lines, title)!;
    }
    let end = found.end;
    while (end > found.start && !lines[end - 1]!.trim()) end--;
    lines.splice(end, 0, ...(end === found.start ? [""] : []), ...items);
  };

  /**
   * Takes feedback into the plan of `change`: one entry under Feedback, the tasks of the phase it
   * names and of every later phase unchecked, and one open question per decision only the person can
   * take. What was raised from that source is settled, and the change is back with the agent.
   */
  const takeIn = (root: string, change: string, feedback: Taken): void => {
    const path = join(folder(root, change), "plan.md");
    const lines = readFileSync(path, "utf8").split("\n");
    if (feedback.phase !== undefined) {
      const phases = section(lines, "Phases");
      let phase = 0;
      for (let i = phases?.start ?? lines.length; i < (phases?.end ?? 0); i++) {
        if (/^### Phase\b/.test(lines[i]!)) phase++;
        if (phase >= feedback.phase)
          lines[i] = lines[i]!.replace(/^(\s*[-*] )\[[xX]\]/, "$1[ ]");
      }
    }
    append(
      lines,
      "Open questions",
      (feedback.questions ?? []).map((q) => `- ${q}`),
      "Architecture decisions",
    );
    append(
      lines,
      "Feedback",
      [`- **${feedback.source}**: ${feedback.says}`],
      "Next step",
    );
    writeFileSync(path, lines.join("\n"));
    const left = raised(root, change).filter(
      (r) => r.source !== feedback.source,
    );
    if (left.length)
      writeFileSync(
        join(folder(root, change), RAISED),
        `${JSON.stringify(left, null, 2)}\n`,
      );
    else rmSync(join(folder(root, change), RAISED), { force: true });
    rmSync(join(folder(root, change), GATE), { force: true });
  };

  const options = (args: string[], name: string): string[] =>
    args.flatMap((a, i) =>
      a === name && args[i + 1] !== undefined ? [args[i + 1]!] : [],
    );
  return { SOURCES, raised, raise, takeIn };
};
