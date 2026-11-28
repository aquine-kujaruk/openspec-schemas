import type { ListProcessesUseCase } from "../../application/use-cases/list-processes.use-case.ts";
import type { PrepareLineUseCase } from "../../application/use-cases/prepare-line.use-case.ts";
import type { Io } from "../../../shared/domain/schemas/io.schema.ts";

type ListedProduct = { name: string; root: string; schema: string };

export type EngineeringPorts = {
  listProcesses(): ListProcessesUseCase;
  listProducts(): Promise<ListedProduct[]>;
  prepareLine(): Promise<{ useCase: PrepareLineUseCase; line: string }>;
};

export class EngineeringController {
  private readonly ports: EngineeringPorts;
  private readonly io: Io;

  constructor(ports: EngineeringPorts, io: Io) {
    this.ports = ports;
    this.io = io;
  }

  async schemas(args: string[]): Promise<number> {
    const listed = (await this.ports.listProcesses().execute()).map((process) => ({
      name: process.name,
      description: process.description,
      workstreams: process.workCenters.map(({ id }) => id),
      ...(process.pilot ? { spike: process.pilot } : {}),
    }));

    const lines = await this.ports.listProducts();

    if (args.includes("--json")) {
      this.io.write(JSON.stringify(lines.length ? { schemas: listed, products: lines } : listed, null, 2));

      return 0;
    }

    for (const { name, description, workstreams, spike } of listed)
      this.io.write(
        `${name}\n  ${description}\n  ${workstreams.length ? `workstreams: ${workstreams.join(", ")}` : "no workstreams: its tasks name none"}${spike ? `\n  spike: ${spike} builds the approved spikes first` : ""}`,
      );

    if (lines.length) {
      this.io.write("\nproducts (a change builds one, made with its schema)");
      for (const { name, root, schema } of lines) this.io.write(`${name}\n  folder: ${root}\n  schema: ${schema}`);
    }

    return 0;
  }

  async prepare(): Promise<number> {
    const { useCase, line } = await this.ports.prepareLine();
    const folders = await useCase.execute(line);
    this.io.write(folders.length ? folders.map((folder) => `created ${folder}`).join("\n") : "nothing to prepare");

    return 0;
  }
}
