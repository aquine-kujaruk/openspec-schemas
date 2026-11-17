import { change, consolidated, validate } from "./production.ts";
import { products } from "./engineering.ts";
import { AuthorizeWriteUseCase } from "./change-control/application/use-cases/authorize-write.use-case.ts";
import { WriteRequest } from "./change-control/domain/value-objects/write-request.value-object.ts";
import { ReleasedWorkOrderAdapter } from "./change-control/infrastructure/adapters/released-work-order.adapter.ts";
import { WriteBoundaryAdapter } from "./change-control/infrastructure/adapters/write-boundary.adapter.ts";
import { ReleasedWorkOrderRepositoryImplementation } from "./change-control/infrastructure/repository-implementations/released-work-order.repository-implementation.ts";
import { WriteBoundaryRepositoryImplementation } from "./change-control/infrastructure/repository-implementations/write-boundary.repository-implementation.ts";
import { runtime } from "./shared/infrastructure/adapters/runtime.adapter.ts";

export const filesOf = (input: unknown): string[] => WriteRequest.fromHook(input).files;
export const projectOf = WriteBoundaryAdapter.projectOf;
export const hookInput = WriteBoundaryAdapter.hookInput;

export async function guard(root: string, paths: string[], cwd = root) {
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
  const orders = new ReleasedWorkOrderRepositoryImplementation(new ReleasedWorkOrderAdapter(async () =>
    (await validate.changesInImplementation(root)).map(({ name, schema, product, builds }) => ({
      name, process: schema, line: product, builds,
    })),
  ));
  const check = await new AuthorizeWriteUseCase(boundary, orders).execute(new WriteRequest({ files: paths }));
  return check.refusals;
}

export async function authorizeWrite(args: string[]): Promise<number> {
  const input = args.length ? {} : hookInput();
  const cwd = input.cwd ?? runtime.workingDirectory();
  const root = projectOf(runtime.environment().CLAUDE_PROJECT_DIR || cwd);
  const refusals = await guard(root, args.length ? args : filesOf(input), cwd);
  for (const refusal of refusals) console.error(refusal.reason);
  return refusals.length ? 2 : 0;
}
