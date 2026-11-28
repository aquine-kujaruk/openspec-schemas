import { describe, expect, it } from "vitest";
import { glued } from "../../../../../factory/quality/domain/services/architecture-standards.service.ts";

describe("glued", () => {
  it("keeps single-line imports and declarations together", () => {
    expect(glued("import 'a';\nimport 'b';\nconst a = 1;\nconst b = 2;")).toEqual([]);
  });

  it("checks returns and throws in nested blocks and switch clauses", () => {
    expect(glued([
      "function run(value: number) {",
      "  switch (value) {",
      "    case 0:",
      "      log(value);",
      "      return value;",
      "    default:",
      "      if (value < 0) {",
      "        log(value);",
      "        throw failure;",
      "      }",
      "  }",
      "}",
    ].join("\n"))).toEqual([5, 9]);
  });

  it("permits a lone return and checks JSX with CRLF", () => {
    expect(glued("function run() { return 1; }")).toEqual([]);
    expect(glued("const view = (\r\n  <div />\r\n);\r\nrender(view);", "app.tsx")).toEqual([4]);
    expect(glued("const view = (\r\n  <div />\r\n);\r\n  \r\nrender(view);", "app.tsx")).toEqual([]);
  });
});
