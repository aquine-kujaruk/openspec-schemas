import { describe, expect, it } from "vitest";
import { writeRequestOfHook } from "../../../../../factory/change-control/domain/schemas/write-request.schema.ts";

const filesOf = (input: unknown) => writeRequestOfHook(input);
const PATCH = [
  "*** Begin Patch",
  "*** Add File: src/orders/domain/order.entity.ts",
  "+export class OrderEntity {}",
  "*** Update File: README.md",
  "*** Move to: docs/README.md",
  "@@",
  "-old",
  "+new",
  "*** Delete File: factory.config.ts",
  "*** End Patch",
].join("\n");

/** Design V3: what each agent hands the hook before a file write. */
describe("the files a tool call is about to write", () => {
  it.each([
    [
      "a file tool's path",
      { file_path: "/p/src/a.ts", content: "x" },
      ["/p/src/a.ts"],
    ],
    ["a notebook's path", { notebook_path: "/p/n.ipynb" }, ["/p/n.ipynb"]],
    [
      "every file of a patch",
      { command: PATCH },
      [
        "src/orders/domain/order.entity.ts",
        "README.md",
        "docs/README.md",
        "factory.config.ts",
      ],
    ],
    ["a patch handed as arguments", { command: ["apply_patch", PATCH] }, 4],
    ["a shell command that is no patch", { command: "ls -la src" }, []],
  ])("%s", (_what, tool_input, expected) => {
    const files = filesOf({ tool_name: "any", tool_input });
    if (typeof expected === "number") expect(files).toHaveLength(expected);
    else expect(files).toEqual(expected);
  });

  it("is none when the hook hands nothing to judge", () => {
    expect(filesOf({})).toEqual([]);
    expect(filesOf(undefined)).toEqual([]);
  });
});
