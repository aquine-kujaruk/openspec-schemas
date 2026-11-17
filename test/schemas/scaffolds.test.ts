import { globSync } from "node:fs";
import { basename, join } from "node:path";
import { render } from "ejs";
import { describe, expect, it } from "vitest";
import { project as architectureproject } from "../../factory/engineering.ts";
const { architecture, exampleArchitecture, WORKSTREAM_DIRS } =
  architectureproject;
import { examples as architectureexamples } from "../../factory/quality.ts";
const { examples } = architectureexamples;
import type { Files } from "../../factory/quality/infrastructure/adapters/sample-file-contract.adapter.ts";
import { exampleFile as architectureexampleFile } from "../../factory/quality.ts";
const { parseExampleFile } = architectureexampleFile;
import { rules as architecturerules } from "../../factory/quality.ts";
const { ruleIds } = architecturerules;

/**
 * Spec: `implementer`, every scaffold renders into a file its layer accepts. Every scaffold of every
 * workstream is rendered with one sample name in one sample module, all together, so that a
 * scaffold finds the scaffolds it imports, and the rules of every workstream run over the result.
 */
const SAMPLE = {
  Name: "Invoice",
  name: "invoice",
  camel: "invoice",
  module: "billing",
  // The resource a framework scaffold composes its use case over: its repository implementation and adapter.
  Resource: "Invoice",
  resource: "invoice",
  resourceCamel: "invoice",
  // The query a mutation scaffold invalidates: its key factory.
  query: "invoice",
  queryCamel: "invoice",
};

/** Rules that judge a file by files another workstream writes: an ACL waits for its adapter. */
const EXEMPT = new Set(["acl-adapter-paired"]);

type Scaffold = { pattern: string; where: string; template: string };
const scaffolds: Scaffold[] = Object.values(WORKSTREAM_DIRS).flatMap((dir) =>
  globSync(join(dir, "*.examples.md")).flatMap((file) =>
    [...parseExampleFile(file).scaffolds].map(([pattern, template]) => ({
      pattern,
      where: join(basename(dir), basename(file)),
      template,
    })),
  ),
);
const references: Files = new Map(
  Object.values(WORKSTREAM_DIRS).flatMap((dir) =>
    globSync(join(dir, "*.examples.md")).flatMap((file) => [
      ...parseExampleFile(file).reference,
    ]),
  ),
);

const pathOf = (pattern: string) =>
  pattern
    .replaceAll("<module>", SAMPLE.module)
    .replaceAll("<name>", SAMPLE.name);
const renderAll = (list: Scaffold[]): Files =>
  new Map(list.map((s) => [pathOf(s.pattern), render(s.template, SAMPLE)]));

/** The scaffolds whose rendered file breaks a rule, named by their pattern and example file. */
const broken = async (list: Scaffold[]): Promise<string[]> => {
  const dirs = Object.entries(WORKSTREAM_DIRS);
  const rules = new Set(dirs.flatMap(([id]) => [...ruleIds(architecture, id)]));
  const [id, dir] = dirs[0]!;
  const ex = examples(exampleArchitecture, dir, id, {
    scaffolds: renderAll(list),
  });
  const found = await ex.all("scaffolds", rules);
  const byPath = new Map(list.map((s) => [pathOf(s.pattern), s]));
  return Object.entries(found)
    .filter(([rule]) => !EXEMPT.has(rule))
    .flatMap(([rule, files]) =>
      files.flatMap((f) => {
        const s = byPath.get(f);
        return s ? [`${s.where}: scaffold ${s.pattern} breaks ${rule}`] : [];
      }),
    )
    .sort();
};

describe("scaffolds", () => {
  it("are found in the examples", () => {
    expect(scaffolds.map((s) => s.pattern)).toContain(
      "src/<module>/infrastructure/acl/<name>.acl.ts",
    );
  });

  it("render into files the rules of their layers accept", async () => {
    expect(await broken(scaffolds)).toEqual([]);
  }, 120_000);

  it("name the scaffold whose rendered file breaks a rule", async () => {
    const entity = scaffolds.find((s) =>
      s.pattern.endsWith("/<name>.entity.ts"),
    )!;
    const unvalidated = {
      ...entity,
      template:
        "export class <%= Name %>Entity {\n  constructor(props: object) {}\n}\n",
    };
    const others = scaffolds.filter((s) => s !== entity);
    expect(await broken([...others, unvalidated])).toContain(
      `${entity.where}: scaffold ${entity.pattern} breaks entity-validates-with-schema`,
    );
  }, 120_000);

  it("copy, without placeholders, the reference file at their path", () => {
    for (const s of scaffolds.filter((s) => !s.pattern.includes("<"))) {
      const reference = references.get(s.pattern);
      if (reference !== undefined)
        expect(s.template, `${s.where}: ${s.pattern}`).toBe(reference);
    }
  });
});
