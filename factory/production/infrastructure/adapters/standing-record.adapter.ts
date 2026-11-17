import { globSync, readFileSync } from "node:fs";
import { join } from "node:path";
import type { StandingRecordAcl } from "../acl/standing-record.acl.ts";

export class StandingRecordAdapter implements StandingRecordAcl {
  readDocuments(root: string, directory: string) {
    return globSync(`${directory}/**/*.md`, { cwd: root }).sort().map((file) => ({
      file,
      document: readFileSync(join(root, file), "utf8"),
    }));
  }
}
