import { globSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const ENTRY = globSync("factory/*.ts").filter((file) => !file.endsWith("/sdk.ts"));
const TRANSPORT = /\bconsole\.(?:log|error|warn|info)\b|\bprocess\.(?:argv|exit|stdin)\b|readFileSync\(0\b/;
const CALLS_USE_CASE = /\.execute\(/;

describe("the entry files only wire", () => {
  it.each(ENTRY)("%s neither speaks to the transport nor runs a use case", (file) => {
    const text = readFileSync(file, "utf8");

    expect(text).not.toMatch(TRANSPORT);
    expect(text).not.toMatch(CALLS_USE_CASE);
  });
});
