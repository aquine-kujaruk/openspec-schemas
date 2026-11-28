import type { AuthorizeWriteUseCase } from "../../application/use-cases/authorize-write.use-case.ts";
import type { Io } from "../../../shared/domain/schemas/io.schema.ts";

export type ChangeControlPorts = {
  authorizeWriteAt(root: string, cwd: string): AuthorizeWriteUseCase;
  hookInput(): { cwd?: string } & Record<string, unknown>;
  filesOf(input: unknown): string[];
  projectOf(directory: string): string;
  workingDirectory(): string;
  projectDirectory(): string | undefined;
};

export class ChangeControlController {
  private readonly ports: ChangeControlPorts;
  private readonly io: Io;

  constructor(ports: ChangeControlPorts, io: Io) {
    this.ports = ports;
    this.io = io;
  }

  async guard(root: string, paths: string[], cwd = root): Promise<string[]> {
    const check = await this.ports.authorizeWriteAt(root, cwd).execute(paths);

    return check.refusals.map(({ reason }) => reason);
  }

  async authorizeWrite(args: string[]): Promise<number> {
    const input = args.length ? {} : this.ports.hookInput();
    const cwd = input.cwd ?? this.ports.workingDirectory();
    const root = this.ports.projectOf(this.ports.projectDirectory() || cwd);
    const refusals = await this.guard(root, args.length ? args : this.ports.filesOf(input), cwd);
    for (const reason of refusals) this.io.warn(reason);

    return refusals.length ? 2 : 0;
  }
}
