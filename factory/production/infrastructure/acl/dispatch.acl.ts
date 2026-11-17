export interface DispatchAcl {
  validateWorkOrder(name: string): Promise<{ready: boolean; findings: {rule: string; message: string}[]}>;
  checkout(path?: string): string;
  getRunner(): Promise<"session" | {command: string}>;
  runCommand(command: string): Promise<number | null>;
}
