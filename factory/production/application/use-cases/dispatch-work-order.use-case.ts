import type { DispatchRepositoryInterface } from "../repository-interfaces/dispatch.repository-interface.ts";

export class DispatchWorkOrderUseCase {
  private readonly dispatch: DispatchRepositoryInterface;

  constructor(dispatch: DispatchRepositoryInterface) {
    this.dispatch = dispatch;
  }

  async execute(name: string, sessionRoot?: string): Promise<{status: number; said: string[]}> {
    const verdict = await this.dispatch.validateWorkOrder(name);
    const invalid = verdict.findings.find(({rule}) => rule === "not-validatable");
    if (invalid) return { status: 1, said: [invalid.message] };
    if (!verdict.ready)
      return { status: 1, said: [
        `${name} is not ready to hand off:`,
        ...verdict.findings.map(({ rule, message }) => `- [${rule}] ${message}`),
      ] };
    const runner = await this.dispatch.getRunner();
    const checkout = this.dispatch.checkout();
    const approved = `Approved checkout: ${checkout}`;
    if (runner === "session" && sessionRoot && this.dispatch.checkout(sessionRoot) !== checkout)
      return { status: 1, said: [approved, `Bind the implementation to ${checkout} before editing ${name}.`] };
    if (runner === "session")
      return {
        status: 0,
        said: [approved, `build ${name} in this session: follow the implement skill, starting with pnpm exec factory implement ${name}`],
      };
    const command = runner.command.replaceAll("{change}", name);
    const status = await this.dispatch.runCommand(command);
    return {
      status: status ?? 1,
      said: [
        approved,
        status === 0
          ? `handed ${name} to: ${command}. Tell the person where it is being built and stop.`
          : `the runner failed (status ${status ?? "killed"}): ${command}. Tell the person.`,
      ],
    };
  }
}
