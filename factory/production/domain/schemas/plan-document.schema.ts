import { z } from "zod";

export const OPERATIONS = [
  "adds",
  "modifies",
  "replaces",
  "renames",
  "removes",
] as const;

export type Operation = (typeof OPERATIONS)[number];

export const TagSchema = z.object({ name: z.string(), value: z.string().optional() });
export type Tag = z.infer<typeof TagSchema>;

export const BlockSchema = z.object({ slug: z.string(), title: z.string(), tags: z.array(TagSchema), body: z.string() });
export type Block = z.infer<typeof BlockSchema>;

export const TaskSchema = z.object({ text: z.string(), done: z.boolean(), workstream: z.string().optional() });
export type Task = z.infer<typeof TaskSchema>;

export const PhaseSchema = z.object({ title: z.string(), tasks: z.array(TaskSchema) });
export type Phase = z.infer<typeof PhaseSchema>;

export const ChangeDecisionSchema = z.object({ text: z.string(), tags: z.array(TagSchema) });
export type ChangeDecision = z.infer<typeof ChangeDecisionSchema>;

export const PlanSchema = z.object({
  openQuestions: z.array(z.string()),
  changeDecisions: z.array(ChangeDecisionSchema),
  approvedAt: z.string().optional(),
  decisions: z.array(BlockSchema),
  procedures: z.array(BlockSchema),
  screens: z.array(BlockSchema),
  phases: z.array(PhaseSchema),
  strayTasks: z.array(TaskSchema),
});

export type Plan = z.infer<typeof PlanSchema>;

const TAG = /@([a-z][a-z-]*)(?::(\S+))?/g;
const TASK = /^\s*[-*] \[([ xX])\] (.*)$/;
const ITEM = /^(?:[-*]|\d+\.) (.*)$/;
const BLOCK = /^### (Decision|Procedure|Screen): (\S+)(?: · (.*))?$/;
const WORKSTREAM = /^([a-z][a-z0-9-]*):\s+\S/;

export const tagsOf = (line: string): Tag[] =>
  [...line.matchAll(TAG)].map((m) => ({ name: m[1]!, value: m[2] }));

export const operationsOf = (block: Block): Tag[] =>
  block.tags.filter((t) => (OPERATIONS as readonly string[]).includes(t.name));

export const tagOf = (block: Block, name: string): Tag | undefined =>
  block.tags.find((t) => t.name === name);

const task = (m: RegExpExecArray): Task => ({
  text: m[2]!,
  done: m[1] !== " ",
  workstream: WORKSTREAM.exec(m[2]!)?.[1],
});

export const parsePlan = (text: string): Plan => {
  const plan: Plan = {
    openQuestions: [],
    changeDecisions: [],
    decisions: [],
    procedures: [],
    screens: [],
    phases: [],
    strayTasks: [],
  };

  const front = /^---\n([\s\S]*?)\n---\n/.exec(text);

  const approved =
    front && /^approved_at:[ \t]*(.*)$/m.exec(front[1]!)?.[1]?.trim();

  if (approved) plan.approvedAt = approved.replace(/^["']|["']$/g, "");
  let section = "";
  let block: Block | undefined;
  let phase: Phase | undefined;
  let tagging = false;
  let fence: string | undefined;

  for (const line of text.replace(/<!--[\s\S]*?-->/g, "").split("\n")) {
    const opening = /^\s*(`{3,}|~{3,})/.exec(line)?.[1];

    if (fence) {
      if (opening?.startsWith(fence)) fence = undefined;
      if (block) block.body += `${line}\n`;
      continue;
    }

    if (opening) {
      fence = opening;
      tagging = false;
      if (block) block.body += `${line}\n`;
      continue;
    }

    if (/^#{1,2} /.test(line)) {
      section = line.startsWith("## ")
        ? line.slice(3).trim().toLowerCase()
        : "";

      block = undefined;
      phase = undefined;
      continue;
    }

    if (line.startsWith("### ")) {
      block = undefined;
      phase = undefined;
      const durable = BLOCK.exec(line);

      const kind =
        section === "architecture decisions"
          ? "Decision"
          : section === "procedures"
            ? "Procedure"
            : section === "screens"
              ? "Screen"
              : undefined;

      if (durable && durable[1] === kind) {
        block = {
          slug: durable[2]!,
          title: durable[3] ?? "",
          tags: [],
          body: "",
        };

        (kind === "Decision"
          ? plan.decisions
          : kind === "Procedure"
            ? plan.procedures
            : plan.screens
        ).push(block);

        tagging = true;
      } else if (section === "phases" && /^### Phase\b/.test(line)) {
        phase = { title: line.slice(4).trim(), tasks: [] };
        plan.phases.push(phase);
      }

      continue;
    }

    const checkbox = TASK.exec(line);
    if (checkbox) (phase ? phase.tasks : plan.strayTasks).push(task(checkbox));

    if (block) {
      if (tagging && line.trim().startsWith("@"))
        block.tags.push(...tagsOf(line));
      else {
        if (line.trim()) tagging = false;
        block.body += `${line}\n`;
      }
    } else if (section === "open questions") {
      const item = ITEM.exec(line);
      if (item) plan.openQuestions.push(item[1]!);
    } else if (section === "decisions") {
      const item = ITEM.exec(line);

      if (item)
        plan.changeDecisions.push({
          text: item[1]!,
          tags: tagsOf(item[1]!.replace(/`[^`]*`/g, "")),
        });
    }
  }

  return plan;
};

export const DeltaRequirementSchema = z.object({ name: z.string(), tags: z.array(TagSchema) });
export type DeltaRequirement = z.infer<typeof DeltaRequirementSchema>;

export const deltaRequirementsOf = (text: string): DeltaRequirement[] => {
  const found: DeltaRequirement[] = [];
  let counted = false;
  let current: DeltaRequirement | undefined;
  let first = false;

  for (const line of text.replace(/<!--[\s\S]*?-->/g, "").split("\n")) {
    if (line.startsWith("## ")) {
      counted = /^## (ADDED|MODIFIED) Requirements\s*$/.test(line);
      current = undefined;
      continue;
    }

    const heading = /^### Requirement: (.+)$/.exec(line);

    if (heading) {
      current = counted ? { name: heading[1]!.trim(), tags: [] } : undefined;
      if (current) found.push(current);
      first = true;
      continue;
    }

    if (current && first && line.trim()) {
      first = false;
      const tagged = /^`(@[^`]*)`$/.exec(line.trim());
      if (tagged) current.tags = tagsOf(tagged[1]!);
    }
  }

  return found;
};
