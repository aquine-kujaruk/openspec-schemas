import { existsSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { activeChanges, CHANGES, GATE } from "./change.ts";
import { PROJECT_ROOT } from "../core/paths.ts";

/** Who raises feedback about a change. */
export const SOURCES = [
  "the person",
  "the completion gate",
  "the verify phase",
  "the archive",
  "the implement phase",
] as const;

/** Feedback a phase or a guard raised and the feedback phase has not taken in yet. */
export type Raised = { source: string; names: string; findings: string[] };

/** Feedback as it is taken in: what it says, the phase it invalidates, and what only the person can decide. */
export type Taken = { source: string; says: string; phase?: number; questions?: string[] };

const RAISED = "feedback.json";
const folder = (root: string, change: string) => join(root, CHANGES, change);

export const raised = (root: string, change: string): Raised[] => {
  const path = join(folder(root, change), RAISED);
  return existsSync(path) ? (JSON.parse(readFileSync(path, "utf8")) as Raised[]) : [];
};

/** Records feedback about `change` for the feedback phase to take in. */
export const raise = (root: string, change: string, feedback: Raised): void => {
  const all = [
    ...raised(root, change).filter(
      (r) => r.source !== feedback.source || r.names !== feedback.names,
    ),
    feedback,
  ];
  writeFileSync(join(folder(root, change), RAISED), `${JSON.stringify(all, null, 2)}\n`);
};

/** The lines of `## <title>`: from the line after its heading up to the next heading of its level or above. */
const section = (lines: string[], title: string): { start: number; end: number } | undefined => {
  const at = lines.findIndex((l) => l.trim().toLowerCase() === `## ${title}`.toLowerCase());
  if (at === -1) return undefined;
  const next = lines.findIndex((l, i) => i > at && /^#{1,2} /.test(l));
  return { start: at + 1, end: next === -1 ? lines.length : next };
};

/** Adds `items` at the end of `## <title>`, creating the section before `## <before>` when the plan lacks it. */
const append = (lines: string[], title: string, items: string[], before: string): void => {
  if (!items.length) return;
  let found = section(lines, title);
  if (!found) {
    const anchor = lines.findIndex((l) => l.trim().toLowerCase() === `## ${before}`.toLowerCase());
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
export const takeIn = (root: string, change: string, feedback: Taken): void => {
  const path = join(folder(root, change), "plan.md");
  const lines = readFileSync(path, "utf8").split("\n");
  if (feedback.phase !== undefined) {
    const phases = section(lines, "Phases");
    let phase = 0;
    for (let i = phases?.start ?? lines.length; i < (phases?.end ?? 0); i++) {
      if (/^### Phase\b/.test(lines[i]!)) phase++;
      if (phase >= feedback.phase) lines[i] = lines[i]!.replace(/^(\s*[-*] )\[[xX]\]/, "$1[ ]");
    }
  }
  append(lines, "Open questions", (feedback.questions ?? []).map((q) => `- ${q}`), "Architecture decisions");
  append(lines, "Feedback", [`- **${feedback.source}**: ${feedback.says}`], "Next step");
  writeFileSync(path, lines.join("\n"));
  const left = raised(root, change).filter((r) => r.source !== feedback.source);
  if (left.length) writeFileSync(join(folder(root, change), RAISED), `${JSON.stringify(left, null, 2)}\n`);
  else rmSync(join(folder(root, change), RAISED), { force: true });
  rmSync(join(folder(root, change), GATE), { force: true });
};

const options = (args: string[], name: string): string[] =>
  args.flatMap((a, i) => (a === name && args[i + 1] !== undefined ? [args[i + 1]!] : []));

/**
 * `factory feedback <change>` lists what was raised about the change and is not taken in yet.
 * `factory feedback <change> raise --from <source> --names <what> --says <text>` raises feedback.
 * `factory feedback <change> take --from <source> --says <text> [--phase <n>] [--ask <question>]…`
 * takes it into the plan.
 */
export const run = async (args: string[]): Promise<number> => {
  const [change, action] = args;
  const known = activeChanges(PROJECT_ROOT);
  if (!change || !known.includes(change)) {
    console.error(`Name the change the feedback is about. Changes: ${known.join(", ") || "none"}`);
    return 2;
  }
  const [from] = options(args, "--from");
  const [says] = options(args, "--says");
  if (!action) {
    const pending = raised(PROJECT_ROOT, change);
    for (const r of pending)
      console.log(`${r.source} about ${r.names}:\n${r.findings.map((f) => `  ${f.split("\n").join("\n  ")}`).join("\n")}`);
    if (!pending.length) console.log("no feedback is waiting to be taken in");
    return 0;
  }
  if (!["raise", "take"].includes(action) || !from || !says || !SOURCES.includes(from as never)) {
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
