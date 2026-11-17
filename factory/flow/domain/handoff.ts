/** What a handoff did: its exit status and what it says the agent does next. */
export type HandedOff = {
  status: number;
  said: string[];
};
/**
 * Hands the change `name` of the project at `root` to the runner the project configures, once
 * validation reports it ready (the person approved it among the rest). With no runner, or
 * `session`, it is built in this session; with a command, the command runs with the change's name
 * in place of `{change}` and its status is the handoff's.
 */
export declare const handoff: (
  root: string,
  name: string,
) => Promise<HandedOff>;
/** `factory handoff <change>`. */
export declare const run: (args: string[]) => Promise<number>;

/** Collaborators supplied by the composition root. */
export type HandoffPorts = {
  spawnSync: (typeof import("node:child_process"))["spawnSync"];
  PROJECT_ROOT: (typeof import("../../shared/domain/paths.ts"))["PROJECT_ROOT"];
  readProjectConfig: (typeof import("../../repository/domain/products.ts"))["readProjectConfig"];
  NotValidatable: (typeof import("./validate.ts"))["NotValidatable"];
  validateChange: (typeof import("./validate.ts"))["validateChange"];
};
