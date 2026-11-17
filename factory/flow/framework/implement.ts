import type { ImplementPorts } from "../domain/implement.ts";

/** Receives the invocation and presents the application's result. */
export const createImplementCommand =
  ({
    join,
    activeChanges,
    readChange,
    PROJECT_ROOT,
    NotValidatable,
    start,
  }: ImplementPorts &
    Omit<
      typeof import("../domain/implement.ts"),
      "run"
    >): (typeof import("../domain/implement.ts"))["run"] =>
  async (args: string[]): Promise<number> => {
    const [name] = args;
    const known = activeChanges(PROJECT_ROOT);
    if (!name || !known.includes(name)) {
      console.error(
        `Name the change to implement. Changes: ${known.join(", ") || "none"}`,
      );
      return 2;
    }
    try {
      const started = await start(PROJECT_ROOT, name);
      if (started.state === "started") {
        const product = readChange(PROJECT_ROOT, name)?.product;
        console.log(
          `in implementation: ${name}${product ? ` (product ${product})` : ""} — ${started.phase}`,
        );
        for (const task of started.tasks) console.log(`- [ ] ${task}`);
        return 0;
      }
      if (started.state === "nothing to build") {
        console.log(`every task of ${name} is done: the verify phase is next`);
        return 0;
      }
      console.log(`${started.state}: ${name}`);
      for (const finding of started.findings) console.log(`- ${finding}`);
      return 1;
    } catch (e) {
      if (!(e instanceof NotValidatable)) throw e;
      console.error(e.message);
      return 2;
    }
  };
