import type { ReadingPorts } from "../domain/reading.ts";

/** Receives the invocation and presents the application's result. */
export const createReadingCommand =
  ({
    join,
    PROJECT_ROOT,
    reading,
  }: ReadingPorts &
    Omit<
      typeof import("../domain/reading.ts"),
      "run"
    >): (typeof import("../domain/reading.ts"))["run"] =>
  async (args: string[]): Promise<number> => {
    const { status, lines } = await reading(PROJECT_ROOT, args);
    (status === 0 ? console.log : console.error)(lines.join("\n"));
    return status;
  };
