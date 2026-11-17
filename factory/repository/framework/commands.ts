import type { Commands } from "../../shared/domain/command.ts";
export const createCommands = (
  handlers: Record<"schemas", (args: string[]) => Promise<number>>,
): Commands => ({
  schemas: {
    usage:
      "schemas [--json]: the schemas a change can be opened with, and the products the project declares",
    run: handlers.schemas,
  },
});
