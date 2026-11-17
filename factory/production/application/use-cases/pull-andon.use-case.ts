import type { AndonRepositoryInterface } from "../repository-interfaces/andon.repository-interface.ts";

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


export class PullAndonUseCase {
  private readonly signals: AndonRepositoryInterface;

  constructor(signals: AndonRepositoryInterface) {
    this.signals = signals;
  }

  reviewerRepairAction(approvedScope: boolean, determinateRule: boolean): string {
    if (!determinateRule) return "ask which outcome to require";
    if (!approvedScope) return "ask for the repair decision";
    return "track and test a separate repair";
  }

  async execute(name: string, feedback: { source: string; says: string; phase?: number; questions?: string[] }): Promise<void> {
    const lines = (await this.signals.readPlan(name)).split("\n");
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
    await this.signals.savePlan(name, lines.join("\n"));
    await this.signals.closeSignal(name, feedback.source);
  }
}
