import { validateSchema } from "../../../shared/domain/schemas/validation.schema.ts";
import { PlanTextSchema, type PlanFeedback, type PlanTextProps } from "../schemas/plan-text.schema.ts";

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

export class PlanTextEntity {
  readonly change!: string;
  readonly text!: string;

  constructor(props: PlanTextProps) {
    validateSchema(this, PlanTextSchema, props);
  }

  static repairAction(approvedScope: boolean, determinateRule: boolean): string {
    if (!determinateRule) return "ask which outcome to require";
    if (!approvedScope) return "ask for the repair decision";

    return "track and test a separate repair";
  }

  withFeedback({ source, says, phase, questions = [] }: PlanFeedback): PlanTextEntity {
    const lines = this.text.split("\n");

    if (phase !== undefined) {
      const phases = section(lines, "Phases");
      let current = 0;

      for (let i = phases?.start ?? lines.length; i < (phases?.end ?? 0); i++) {
        if (/^### Phase\b/.test(lines[i]!)) current++;
        if (current >= phase) lines[i] = lines[i]!.replace(/^(\s*[-*] )\[[xX]\]/, "$1[ ]");
      }
    }

    append(lines, "Open questions", questions.map((question) => `- ${question}`), "Architecture decisions");
    append(lines, "Feedback", [`- **${source}**: ${says}`], "Next step");

    return new PlanTextEntity({ change: this.change, text: lines.join("\n") });
  }
}
