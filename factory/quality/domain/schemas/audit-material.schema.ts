export type AuditRow = {
  id: string;
  title: string;
  question: string;
  folders: string[];
  crossFile: boolean;
};

export type LoadedAuditRow = AuditRow & {
  verdict: "accepted" | "rejected";
  reason?: string;
};

export type AuditSource = { path: string; content: string };
export type AuditFile = AuditSource & { folder: string };
export type AuditSpan = { from: number; to: number; label: string; parts: AuditSpan[] };

export type AuditQuestion = {
  name: string;
  instructions: string;
  excerpt: string;
};

export type AuditAnswers = Map<string, number>;

export type AuditRubric = { path: string; markdown: string };

export type AuditPass = {
  rubric?: string;
  files: Record<string, { hash: string; commit: string | null }>;
};
