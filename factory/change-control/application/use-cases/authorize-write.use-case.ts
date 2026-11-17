import type { Refusal } from "../../domain/schemas/authorization.schema.ts";
import type { ReleasedWorkOrder, WritableLine, WriteBoundary } from "../../domain/schemas/write-boundary.schema.ts";
import { Authorization } from "../../domain/value-objects/authorization.value-object.ts";
import { ProtectedArea } from "../../domain/value-objects/protected-area.value-object.ts";
import type { WriteRequest } from "../../domain/value-objects/write-request.value-object.ts";
import type { ReleasedWorkOrderRepositoryInterface } from "../repository-interfaces/released-work-order.repository-interface.ts";
import type { WriteBoundaryRepositoryInterface } from "../repository-interfaces/write-boundary.repository-interface.ts";

const within = (path: string, folder: string): boolean => path === folder || path.startsWith(`${folder}/`);

const harness = ({ lines, changes, decisions, procedures }: WriteBoundary): ProtectedArea[] => [
  new ProtectedArea({
    name: "factory configuration", patterns: ["^factory\\.config\\.[cm]?[jt]s$"],
    regularExpression: true, guidance: "the person edits it",
  }),
  new ProtectedArea({
    name: "generated tests", patterns: lines.map(({ acceptance }) => acceptance), suffix: ".feature.test.ts",
    guidance: "change the spec they come from and run `pnpm exec factory generate`",
  }),
  new ProtectedArea({
    name: "installed schemas", patterns: ["openspec/schemas"],
    guidance: "they change when the package is installed again",
  }),
  new ProtectedArea({
    name: "consolidated specs", patterns: ["openspec/specs"],
    guidance: "write a delta spec in a change; archiving merges it",
  }),
  new ProtectedArea({
    name: "consolidated decisions", patterns: [decisions],
    guidance: "write an architecture decision in a plan; archiving consolidates it",
  }),
  new ProtectedArea({
    name: "consolidated procedures", patterns: [procedures],
    guidance: "write a procedure in a plan; archiving consolidates it",
  }),
  new ProtectedArea({
    name: "archived changes", patterns: [`${changes}/archive`],
    guidance: "an archived change is history; open a new change",
  }),
  new ProtectedArea({
    name: "agent skills", patterns: [".claude/skills", ".agents/skills"],
    guidance: "they change when the package is installed again",
  }),
  new ProtectedArea({
    name: "agent guards", patterns: [".claude/settings.json", ".claude/settings.local.json", ".codex"],
    guidance: "they change when the package is installed again",
  }),
  new ProtectedArea({
    name: "installed command", patterns: ["node_modules"],
    guidance: "it changes when the command is pinned again",
  }),
];

const refusalFor = (path: string, started: ReleasedWorkOrder[], line?: WritableLine): string => {
  if (!started.length)
    return `${path} is product code and no change is in implementation: start with the \`plan\` phase, and write product code through the \`implement\` phase once validation reports the change ready`;
  const listed = started.map(({ name, line, process }) =>
    `${name}, ${line ? `product ${line}, ` : ""}${process}`,
  ).join("; ");
  if (line)
    return `${path} belongs to the product ${line.name}, and no change of that product is in implementation (${listed}): a product's folder opens only to a change of that product, opened by the \`plan\` phase`;
  return `${path} is product code and the change in implementation (${listed}) was made with a schema that builds none: product code is written through a change of a schema that has workstreams, opened by the \`plan\` phase`;
};

export class AuthorizeWriteUseCase {
  private readonly boundary: WriteBoundaryRepositoryInterface;
  private readonly orders: ReleasedWorkOrderRepositoryInterface;

  constructor(boundary: WriteBoundaryRepositoryInterface, orders: ReleasedWorkOrderRepositoryInterface) {
    this.boundary = boundary;
    this.orders = orders;
  }

  async execute(request: WriteRequest): Promise<Authorization> {
    const configured = await this.boundary.getBoundary();
    const declared = configured.lines.some(({ name }) => name !== "");
    const protectedAreas = harness(configured);
    const implicitRoots = configured.lines[0]?.roots ?? [];
    const refusals: Refusal[] = [];
    let blockedBy: ProtectedArea | undefined;
    let started: ReleasedWorkOrder[] | undefined;

    for (const file of request.files) {
      const path = this.boundary.findProjectPath(file);
      if (path === null) continue;
      const area = protectedAreas.find((candidate) => candidate.covers(path));
      if (area) {
        blockedBy ??= area;
        refusals.push({
          path, part: area.name,
          reason: `${path} belongs to the harness (${area.name}) and an agent never writes it: ${area.guidance}`,
        });
        continue;
      }

      const line = declared
        ? configured.lines.filter(({ folder }) => folder === "." || within(path, folder))
            .sort((left, right) => right.folder.length - left.folder.length)[0]
        : undefined;
      if (declared ? !line : !implicitRoots.some((root) => within(path, root))) continue;
      started ??= await this.orders.listReleasedWorkOrders();
      if (line ? started.some((order) => order.line === line.name) : started.some(({ builds }) => builds)) continue;
      refusals.push({ path, reason: refusalFor(path, started, line) });
    }

    return new Authorization({ blockedBy, refusals });
  }
}
