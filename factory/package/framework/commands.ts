import type { Commands } from "../../shared/domain/command.ts";
export const createCommands = (
  handlers: Record<
    "doctor" | "guard" | "gate",
    (args: string[]) => Promise<number>
  >,
): Commands => ({
  doctor: {
    usage: "doctor [--fix]: lists what the flow needs and the project lacks",
    run: handlers.doctor,
  },
  guard: {
    usage: "guard [path…]: judges a write an agent is about to make",
    run: handlers.guard,
  },
  gate: {
    usage: "gate [--helper]: judges an agent's attempt to finish",
    run: handlers.gate,
  },
});
