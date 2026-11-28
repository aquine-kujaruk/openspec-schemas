import { randomUUID } from "node:crypto";
import { closeSync, existsSync, openSync, readFileSync, renameSync, unlinkSync, writeFileSync } from "node:fs";
import { setTimeout as delay } from "node:timers/promises";
import { QualityException } from "../../domain/exceptions/quality.exceptions.ts";
import { RubricHistorySchema, type RubricHistoryAcl, type RubricObservation } from "../acl/rubric-history.acl.ts";

const lockExists = "EEXIST";

export class FileRubricHistoryAdapter implements RubricHistoryAcl {
  private readonly path: string;

  constructor(path: string) {
    this.path = path;
  }

  private load(): Record<string, RubricObservation[]> {
    if (!existsSync(this.path)) return {};

    try {
      const input: unknown = JSON.parse(readFileSync(this.path, "utf8"));

      return RubricHistorySchema.parse(input);
    } catch (cause) {
      throw new QualityException(`Invalid rubric score history in ${this.path}`, { cause });
    }
  }

  read(id: string): RubricObservation[] {
    return this.load()[id] ?? [];
  }

  async append(id: string, observation: RubricObservation): Promise<RubricObservation[]> {
    const path = this.path;
    const lock = path + ".lock";
    const deadline = Date.now() + 10_000;

    while (true) {
      try {
        closeSync(openSync(lock, "wx"));
        break;
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== lockExists || Date.now() >= deadline) throw error;
        await delay(20);
      }
    }

    const tmp = path + "." + randomUUID();

    try {
      const all = this.load();
      const previous = all[id] ?? [];
      all[id] = [...previous, observation];
      writeFileSync(tmp, JSON.stringify(all, null, 2) + "\n");
      renameSync(tmp, path);

      return previous;
    } finally {
      if (existsSync(tmp)) unlinkSync(tmp);
      unlinkSync(lock);
    }
  }
}
