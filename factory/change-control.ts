import { change, consolidated, validate } from "./production.ts";
import { products } from "./engineering.ts";
import { AuthorizeWriteUseCase } from "./change-control/application/use-cases/authorize-write.use-case.ts";
import { writeRequestOfHook } from "./change-control/domain/schemas/write-request.schema.ts";
import { WriteBoundaryAdapter } from "./change-control/infrastructure/adapters/write-boundary.adapter.ts";
import { ReleasedWorkOrderRepositoryImplementation } from "./change-control/infrastructure/repository-implementations/released-work-order.repository-implementation.ts";
import { WriteBoundaryRepositoryImplementation } from "./change-control/infrastructure/repository-implementations/write-boundary.repository-implementation.ts";
import { runtime } from "./shared/infrastructure/adapters/runtime.adapter.ts";
import { consoleIo } from "./shared/infrastructure/adapters/cli.adapter.ts";
import { ChangeControlController } from "./change-control/framework/controllers/change-control.controller.ts";

export const filesOf = (input: unknown): string[] => writeRequestOfHook(input);
export const projectOf = WriteBoundaryAdapter.projectOf;
export const hookInput = WriteBoundaryAdapter.hookInput;

const authorizeWriteAt = (root: string, cwd: string) => {
  const boundary = new WriteBoundaryRepositoryImplementation(new WriteBoundaryAdapter(root, cwd, async () => ({
    lines: (await products.projectProducts(root)).map((line) => ({
      name: line.name,
      folder: line.root,
      roots: products.productRoots(line.config),
      acceptance: line.config.acceptance,
    })),
    changes: change.CHANGES,
    decisions: consolidated.DECISIONS,
    procedures: consolidated.PROCEDURES,
  })));

  const orders = new ReleasedWorkOrderRepositoryImplementation(async () =>
    (await validate.changesInImplementation(root)).map(({ name, schema, product, builds }) => ({
      name, process: schema, line: product, builds,
    })),
  );

  return new AuthorizeWriteUseCase(boundary, orders);
};

const controller = new ChangeControlController({
  authorizeWriteAt,
  hookInput,
  filesOf,
  projectOf,
  workingDirectory: runtime.workingDirectory,
  projectDirectory: () => runtime.environment().CLAUDE_PROJECT_DIR,
}, consoleIo);

export const guard = controller.guard.bind(controller);
export const authorizeWrite = controller.authorizeWrite.bind(controller);
