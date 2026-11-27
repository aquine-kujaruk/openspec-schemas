import { z } from "zod";

const PATCH_FILE = /^\*\*\* (?:(?:Add|Update|Delete) File|Move to): (.+)$/gm;

/** The files a tool call is about to write. */
export const WriteRequestSchema = z.array(z.string());
export type WriteRequest = z.infer<typeof WriteRequestSchema>;

/** The files the payload an agent hands the hook names: a tool's path, a notebook's, or every file of a patch. */
export const writeRequestOfHook = (input: unknown): WriteRequest => {
  const tool = (input as { tool_input?: Record<string, unknown> } | null | undefined)?.tool_input ?? {};
  const named = [tool.file_path, tool.notebook_path, tool.path].filter(
    (path): path is string => typeof path === "string",
  );
  const command = Array.isArray(tool.command) ? tool.command.join("\n") : tool.command;
  const patched = typeof command === "string"
    ? [...command.matchAll(PATCH_FILE)].map((match) => match[1]!.trim())
    : [];
  return WriteRequestSchema.parse([...new Set([...named, ...patched])]);
};
