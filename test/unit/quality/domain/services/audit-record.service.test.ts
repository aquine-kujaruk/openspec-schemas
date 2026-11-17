import { describe, expect, it } from "vitest";
import { AuditRecordService } from "../../../../../factory/quality/domain/services/audit-record.service.ts";

const records = new AuditRecordService((content) => content);

const FILES = [
  { path: "src/a/domain/entities/a.entity.ts", content: "export class A {}" },
  { path: "src/b/domain/entities/b.entity.ts", content: "export class B {}" },
];

describe("pass record", () => {
  it("judges every file when no pass is recorded", () => {
    expect(records.touched(FILES, { files: {} }, "rubric")).toEqual(FILES);
  });
  it("judges only the files changed since the recorded pass", () => {
    const record = records.recordPass({ files: {} }, FILES, "abc123", "rubric");
    const changed = [
      FILES[0],
      { ...FILES[1], content: "export class B { x = 1 }" },
    ];
    expect(records.touched(changed, record, "rubric").map((f) => f.path)).toEqual([
      FILES[1].path,
    ]);
  });
  it("judges nothing when nothing changed", () => {
    expect(records.touched(FILES, records.recordPass({ files: {} }, FILES, null, "rubric"), "rubric")).toEqual([]);
  });
  it("judges every file again when the rubric changed, and nothing when it is the same", () => {
    const row = {
      id: "S09",
      title: "t",
      question: "q?",
      folders: ["domain"],
      crossFile: false,
    };
    const before = records.rubricHash([row]);
    const after = records.rubricHash([{ ...row, question: "another q?" }]);
    expect(before).not.toBe(after);
    expect(records.rubricHash([{ ...row, title: "other prose" }])).toBe(before);
    const record = records.recordPass({ files: {} }, FILES, "abc123", before);
    expect(record.rubric).toBe(before);
    expect(records.touched(FILES, record, before)).toEqual([]);
    expect(records.touched(FILES, record, after)).toEqual(FILES);
    expect(records.recordPass(record, [], null, after).rubric).toBe(after);
  });
});
