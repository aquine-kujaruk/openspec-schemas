import { validateSchema } from "../../../shared/domain/schemas/validation.schema.ts";
import type { Refusal } from "../schemas/authorization.schema.ts";

import {
  PathKind,
  WriteBoundaryAggregateSchema,
  type ReleasedWorkOrder,
  type WritableLine,
  type WriteBoundary,
  type WriteBoundaryAggregateProps,
} from "../schemas/write-boundary.schema.ts";

import { ProtectedAreaValueObject } from "../value-objects/protected-area.value-object.ts";

export type PathResolution =
  | { kind: typeof PathKind.Harness; area: ProtectedAreaValueObject }
  | { kind: typeof PathKind.Outside }
  | { kind: typeof PathKind.Product; line?: WritableLine };

const within = (path: string, folder: string): boolean => path === folder || path.startsWith(`${folder}/`);

const harness = ({ lines, changes, decisions, procedures }: WriteBoundary): ProtectedAreaValueObject[] => [
  new ProtectedAreaValueObject({
    name: "factory configuration", patterns: ["^factory\\.config\\.[cm]?[jt]s$"],
    regularExpression: true, guidance: "the person edits it",
  }),
  new ProtectedAreaValueObject({
    name: "generated tests", patterns: lines.map(({ acceptance }) => acceptance), suffix: ".feature.test.ts",
    guidance: "change the spec they come from and run `pnpm exec factory generate`",
  }),
  new ProtectedAreaValueObject({
    name: "installed schemas", patterns: ["openspec/schemas"],
    guidance: "they change when the package is installed again",
  }),
  new ProtectedAreaValueObject({
    name: "consolidated specs", patterns: ["openspec/specs"],
    guidance: "write a delta spec in a change; archiving merges it",
  }),
  new ProtectedAreaValueObject({
    name: "consolidated decisions", patterns: [decisions],
    guidance: "write an architecture decision in a plan; archiving consolidates it",
  }),
  new ProtectedAreaValueObject({
    name: "consolidated procedures", patterns: [procedures],
    guidance: "write a procedure in a plan; archiving consolidates it",
  }),
  new ProtectedAreaValueObject({
    name: "archived changes", patterns: [`${changes}/archive`],
    guidance: "an archived change is history; open a new change",
  }),
  new ProtectedAreaValueObject({
    name: "agent skills", patterns: [".claude/skills", ".agents/skills"],
    guidance: "they change when the package is installed again",
  }),
  new ProtectedAreaValueObject({
    name: "agent guards", patterns: [".claude/settings.json", ".claude/settings.local.json", ".codex"],
    guidance: "they change when the package is installed again",
  }),
  new ProtectedAreaValueObject({
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

export class WriteBoundaryAggregate {
  readonly lines!: WritableLine[];
  readonly protectedAreas!: ProtectedAreaValueObject[];

  constructor(props: WriteBoundaryAggregateProps) {
    validateSchema(this, WriteBoundaryAggregateSchema, props);
  }

  static from(record: WriteBoundary): WriteBoundaryAggregate {
    return new WriteBoundaryAggregate({ lines: record.lines, protectedAreas: harness(record) });
  }

  resolve(path: string): PathResolution {
    const area = this.protectedAreas.find((candidate) => candidate.covers(path));
    if (area) return { kind: PathKind.Harness, area };

    if (!this.lines.some(({ name }) => name !== ""))
      return (this.lines[0]?.roots ?? []).some((root) => within(path, root)) ? { kind: PathKind.Product } : { kind: PathKind.Outside };

    const line = this.lines
      .filter(({ folder }) => folder === "." || within(path, folder))
      .sort((left, right) => right.folder.length - left.folder.length)[0];

    return line ? { kind: PathKind.Product, line } : { kind: PathKind.Outside };
  }

  harnessRefusal(path: string, area: ProtectedAreaValueObject): Refusal {
    return {
      path, part: area.name,
      reason: `${path} belongs to the harness (${area.name}) and an agent never writes it: ${area.guidance}`,
    };
  }

  productRefusal(path: string, started: ReleasedWorkOrder[], line?: WritableLine): Refusal | undefined {
    const admitted = line ? started.some((order) => order.line === line.name) : started.some(({ builds }) => builds);

    return admitted ? undefined : { path, reason: refusalFor(path, started, line) };
  }
}
