import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import type { AndonSignalAcl, Raised } from "../acl/andon-signal.acl.ts";
import { CHANGES } from "./work-order-record.adapter.ts";

export const SOURCES = [
  "the person",
  "the completion gate",
  "the verify phase",
  "the archive",
  "the implement phase",
] as const;

export class AndonSignalAdapter implements AndonSignalAcl {
  raised(root: string, change: string): Raised[] {
    const path = join(root, CHANGES, change, "feedback.json");

    return existsSync(path)
      ? (JSON.parse(readFileSync(path, "utf8")) as Raised[])
      : [];
  }

  raise(root: string, change: string, feedback: Raised): void {
    const all = [
      ...this.raised(root, change).filter(
        (r) => r.source !== feedback.source || r.names !== feedback.names,
      ),
      feedback,
    ];

    writeFileSync(
      join(root, CHANGES, change, "feedback.json"),
      `${JSON.stringify(all, null, 2)}\n`,
    );
  }
}
