import { mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { reviewRecord as architecturereviewRecord } from "../../architecture.ts";
const {
  emptyRecord,
  hashOf,
  readRecord,
  recordPass,
  rubricHash,
  touched,
  writeRecord,
} = architecturereviewRecord;

const FILES = [
  { path: "src/a/domain/entities/a.entity.ts", content: "export class A {}" },
  { path: "src/b/domain/entities/b.entity.ts", content: "export class B {}" },
];

describe("pass record", () => {
  it("judges every file when no pass is recorded", () => {
    expect(touched(FILES, emptyRecord())).toEqual(FILES);
  });
  it("judges only the files changed since the recorded pass", () => {
    const record = recordPass(emptyRecord(), FILES, "abc123");
    const changed = [
      FILES[0],
      { ...FILES[1], content: "export class B { x = 1 }" },
    ];
    expect(touched(changed, record).map((f) => f.path)).toEqual([
      FILES[1].path,
    ]);
  });
  it("judges nothing when nothing changed", () => {
    expect(touched(FILES, recordPass(emptyRecord(), FILES, null))).toEqual([]);
  });
  it("judges every file again when the rubric changed, and nothing when it is the same", () => {
    const row = {
      id: "S09",
      title: "t",
      question: "q?",
      folders: ["domain"],
      crossFile: false,
    };
    const before = rubricHash([row]);
    const after = rubricHash([{ ...row, question: "another q?" }]);
    expect(before).not.toBe(after);
    expect(rubricHash([{ ...row, title: "other prose" }])).toBe(before);
    const record = recordPass(emptyRecord(), FILES, "abc123", before);
    expect(record.rubric).toBe(before);
    expect(touched(FILES, record, before)).toEqual([]);
    expect(touched(FILES, record, after)).toEqual(FILES);
    expect(recordPass(record, [], null, after).rubric).toBe(after);
  });
  it("stores the content hash and the commit per judged file, sorted, and round-trips through disk", () => {
    const root = mkdtempSync(join(tmpdir(), "factory-review-"));
    const record = recordPass(emptyRecord(), [FILES[1], FILES[0]], "abc123");
    writeRecord(root, record);
    expect(readRecord(root)).toEqual({
      files: {
        [FILES[0].path]: { hash: hashOf(FILES[0].content), commit: "abc123" },
        [FILES[1].path]: { hash: hashOf(FILES[1].content), commit: "abc123" },
      },
    });
    expect(readFileSync(join(root, ".factory-review.json"), "utf8")).toMatch(
      /\n$/,
    );
  });
  it("reads an empty record where none exists", () => {
    expect(readRecord(mkdtempSync(join(tmpdir(), "factory-review-")))).toEqual({
      files: {},
    });
  });
});
