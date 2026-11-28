import { describe, expect, it } from "vitest";
import { AuthorizeWriteUseCase } from "../../factory/change-control/application/use-cases/authorize-write.use-case.ts";
import { ChangeControlController } from "../../factory/change-control/framework/controllers/change-control.controller.ts";
import type { Io } from "../../factory/shared/domain/schemas/io.schema.ts";

const boundary = {
  getBoundary: async () => ({
    lines: [{ name: "", folder: ".", roots: ["src"], acceptance: "test/acceptance" }],
    changes: "openspec/changes",
    decisions: "openspec/adr",
    procedures: "openspec/runbooks",
  }),
  findProjectPath: (file: string) => file,
};

const memory = () => {
  const said: string[] = [];
  const io: Io = { write: (line) => said.push(line), warn: (line) => said.push(line), stdin: () => "" };

  return { said, io };
};

const controllerWith = (io: Io) => new ChangeControlController({
  authorizeWriteAt: () => new AuthorizeWriteUseCase(boundary, { listReleasedWorkOrders: async () => [] }),
  hookInput: () => ({}),
  filesOf: () => [],
  projectOf: (directory) => directory,
  workingDirectory: () => "/project",
  projectDirectory: () => undefined,
}, io);

describe("the change-control controller", () => {
  it.each([
    ["src/orders/order.entity.ts", 2],
    ["README.md", 0],
  ])("keeps the use case's decision on %s through an in-memory transport", async (path, status) => {
    const { said, io } = memory();
    const direct = await new AuthorizeWriteUseCase(boundary, { listReleasedWorkOrders: async () => [] }).execute([path]);

    expect(await controllerWith(io).authorizeWrite([path])).toBe(status);
    expect(said).toEqual(direct.refusals.map(({ reason }) => reason));
  });
});
