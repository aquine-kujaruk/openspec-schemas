import { validateSchema } from "../../../shared/domain/schemas/validation.schema.ts";
import { WriteRequestSchema, type WriteRequestProps } from "../schemas/write-request.schema.ts";

const PATCH_FILE = /^\*\*\* (?:(?:Add|Update|Delete) File|Move to): (.+)$/gm;

export class WriteRequest {
  readonly files!: string[];

  constructor(props: WriteRequestProps) {
    validateSchema(this, WriteRequestSchema, props);
  }

  static fromHook(input: unknown): WriteRequest {
    const tool = (input as { tool_input?: Record<string, unknown> } | null | undefined)?.tool_input ?? {};
    const named = [tool.file_path, tool.notebook_path, tool.path].filter(
      (path): path is string => typeof path === "string",
    );
    const command = Array.isArray(tool.command) ? tool.command.join("\n") : tool.command;
    const patched = typeof command === "string"
      ? [...command.matchAll(PATCH_FILE)].map((match) => match[1]!.trim())
      : [];
    return new WriteRequest({ files: [...new Set([...named, ...patched])] });
  }
}
