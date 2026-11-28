import type {
  AuditAnswers,
  AuditFile,
  AuditQuestion,
  AuditRow,
  AuditSpan,
} from "../schemas/audit-material.schema.ts";

import { AuditFindingValueObject } from "../value-objects/audit-finding.value-object.ts";

export type AuditFunnelOptions = {
  ask: (state: string, questions: AuditQuestion[], locations: string[]) => Promise<AuditAnswers>;
  outline: (file: AuditFile) => AuditSpan[];
  rows: AuditRow[];
  files: AuditFile[];
  threshold: number;
  spanLines: number;
  batch: { files: number; chars: number };
};

const numbered = (source: string): string =>
  source.split("\n").map((line, at) => `${String(at + 1).padStart(4)} | ${line}`).join("\n");

const slice = (source: string, span: AuditSpan): string =>
  source.split("\n").slice(span.from - 1, span.to).join("\n");

const batches = (
  files: AuditFile[],
  cap: { files: number; chars: number },
): AuditFile[][] => {
  const out: AuditFile[][] = [];
  let current: AuditFile[] = [];
  let chars = 0;

  for (const f of files) {
    const size = f.content.length;

    if (
      current.length &&
      (current.length >= cap.files || chars + size > cap.chars)
    ) {
      out.push(current);
      current = [];
      chars = 0;
    }

    current.push(f);
    chars += size;
  }

  if (current.length) out.push(current);

  return out;
};

export class AuditFunnelService {
  async inspect(o: AuditFunnelOptions): Promise<AuditFindingValueObject[]> {
    const rows = o.rows.filter((r) => !r.crossFile);

    const yes = (p: number | undefined): p is number =>
      p !== undefined && p >= o.threshold;

    const findings: AuditFindingValueObject[] = [];
    const folders = [...new Set(rows.flatMap((r) => r.folders))];
    const candidates = new Map<string, Map<string, number>>();

    for (const folder of folders) {
      const rowsHere = rows.filter((r) => r.folders.includes(folder));
      const filesHere = o.files.filter((f) => f.folder === folder);

      for (const batch of batches(filesHere, o.batch)) {
        const state = batch
          .map((f) => `=== ${f.path} ===\n${f.content}`)
          .join("\n\n");

        const questions: AuditQuestion[] = [];
        const locations: string[] = [];

        for (const row of rowsHere)
          for (const [i, f] of batch.entries()) {
            locations.push(f.path);

            questions.push({
              name: `${row.id}_f${i}`,
              instructions: `Consider only the file ${f.path}. ${row.question}`,
              excerpt: f.content,
            });
          }

        const answers = await o.ask(state, questions, locations);

        for (const row of rowsHere)
          for (const [i, f] of batch.entries()) {
            const p = answers.get(`${row.id}_f${i}`);

            if (yes(p))
              (
                candidates.get(f.path) ??
                candidates.set(f.path, new Map()).get(f.path)!
              ).set(row.id, p);
          }
      }
    }

    for (const [path, byRow] of candidates) {
      const file = o.files.find((f) => f.path === path)!;
      const state = `File: ${file.path}\n\n${numbered(file.content)}`;
      const units = o.outline(file);
      const rowsHere = rows.filter((r) => byRow.has(r.id));

      const ask = async (row: AuditRow, spans: AuditSpan[]) => {
        const questions = spans.map((s, i) => ({
          name: `${row.id}_s${i}`,
          instructions: `Evaluate ${row.id} at ${path}, lines ${s.from}-${s.to} (${s.label}). Use the surrounding file to interpret this range. The predicate is true when the specified range itself exhibits the violation. Rubric: ${row.question}`,
          excerpt: slice(file.content, s),
        }));

        const locations = spans.map(span => `${path}:${span.from}-${span.to}`);
        const answers = await o.ask(state, questions, locations);

        return spans.flatMap((s, i) => {
          const p = answers.get(`${row.id}_s${i}`);

          return yes(p) ? [{ span: s, p }] : [];
        });
      };

      const narrow = async (row: AuditRow, span: AuditSpan, p: number): Promise<void> => {
        const parts =
          span.to - span.from + 1 > o.spanLines ? span.parts : [];

        if (!parts.length) {
          findings.push(new AuditFindingValueObject({
            row: row.id,
            p,
            file: path,
            from: span.from,
            to: span.to,
            title: row.title,
          }));

          return;
        }

        for (const hit of await ask(row, parts))
          await narrow(row, hit.span, hit.p);
      };

      for (const row of rowsHere) {
        if (!units.length) {
          findings.push(new AuditFindingValueObject({
            row: row.id,
            p: byRow.get(row.id)!,
            file: path,
            from: 1,
            to: file.content.split("\n").length,
            title: row.title,
          }));

          continue;
        }

        for (const hit of await ask(row, units))
          await narrow(row, hit.span, hit.p);
      }
    }

    return findings;
  }
}
