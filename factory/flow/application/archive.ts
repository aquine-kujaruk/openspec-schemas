import type { Archived } from "../domain/archive.ts";
import type { Block } from "../../shared/domain/plan.ts";
import type { ArchivePorts } from "../domain/archive.ts";

/** Builds these use cases from their capabilities; importing them touches no resources. */
export const createArchive = ({
  existsSync,
  mkdirSync,
  readFileSync,
  renameSync,
  rmSync,
  writeFileSync,
  dirname,
  join,
  activeChanges,
  CHANGES,
  readChange,
  DECISIONS,
  PROCEDURES,
  readConsolidated,
  digestOf,
  readEvidence,
  raise,
  openspec,
  DEVELOPING,
  PROJECT_ROOT,
  self,
  operationsOf,
  parsePlan,
  tagOf,
  NotValidatable,
  validateChange,
}: ArchivePorts): Omit<typeof import("../domain/archive.ts"), "run"> => {
  type Kind = "Decision" | "Procedure";

  type File = { header: string; blocks: Array<{ slug: string; text: string }> };

  const TAG_RULES = [
    "operation-tag-holds",
    "operation-records-base",
    "one-operation-tag",
  ];

  const today = () => new Date().toISOString().slice(0, 10);

  const readFile = (path: string, kind: Kind): File => {
    if (!existsSync(path)) return { header: "", blocks: [] };
    const [header, ...blocks] = readFileSync(path, "utf8").split(
      new RegExp(`^(?=### ${kind}: )`, "m"),
    );
    return {
      header: header!.trimEnd(),
      blocks: blocks.map((text) => ({
        slug: new RegExp(`^### ${kind}: (\\S+)`).exec(text)![1]!,
        text: text.trimEnd(),
      })),
    };
  };

  /** The paragraph of `body` that opens with the bold label `label`, without the label. */
  const labelled = (body: string, label: string): string | undefined =>
    new RegExp(
      `^\\*\\*${label}\\*\\*\\s*([\\s\\S]*?)(?=^\\*\\*[A-Z][a-z]+\\*\\*|(?![\\s\\S]))`,
      "m",
    )
      .exec(body)?.[1]
      ?.trim();

  /** What a plan's block leaves standing: a decision keeps its statement and its reason, a procedure keeps everything. */
  const consolidated = (kind: Kind, block: Block, origin: string): string => {
    const kept = (names: string[]) =>
      names.flatMap((n) =>
        tagOf(block, n)?.value ? [`@${n}:${tagOf(block, n)!.value}`] : [],
      );
    const heading = `### ${kind}: ${block.slug}${block.title ? ` · ${block.title}` : ""}`;
    if (kind === "Procedure")
      return [
        heading,
        [`@origin:${origin}`, ...kept(["env", "probed", "keys", "by"])].join(
          " ",
        ),
        block.body.trim(),
      ].join("\n\n");
    const statement = block.body.split(/^\*\*[A-Z][a-z]+\*\*/m)[0]!.trim();
    const why = labelled(block.body, "Why");
    return [
      heading,
      [`@origin:${origin}`, ...kept(["applies", "enforced", "by"])].join(" "),
      statement,
      ...(why ? [`**Why** ${why}`] : []),
    ].join("\n\n");
  };

  /**
   * Applies the operation each durable block of the plan declares to the consolidated tree of its
   * kind, stamping what it writes with `origin`. Returns every file it touched as it was before.
   */
  const consolidate = (
    root: string,
    blocks: Block[],
    kind: Kind,
    origin: string,
    product = "",
  ): Map<string, string | undefined> => {
    const tree = kind === "Decision" ? DECISIONS : PROCEDURES;
    const standing =
      readConsolidated(root)[kind === "Decision" ? "decisions" : "procedures"];
    const files = new Map<string, File>();
    const open = (path: string) =>
      files.get(path) ??
      files.set(path, readFile(join(root, path), kind)).get(path)!;
    // With products, a decision lives under the product its change builds.
    const home = (block: Block) =>
      join(
        tree,
        kind === "Decision" ? product : "",
        tagOf(block, kind === "Decision" ? "area" : "purpose")?.value ?? "",
        `${tagOf(block, "topic")?.value}.md`,
      );
    const drop = (slug: string) => {
      const file = open(standing.get(slug)!.file);
      file.blocks = file.blocks.filter((b) => b.slug !== slug);
    };
    for (const block of blocks) {
      const operation = operationsOf(block)[0]!;
      const text = consolidated(kind, block, origin);
      if (operation.name === "adds")
        open(home(block)).blocks.push({ slug: block.slug, text });
      else if (operation.name === "removes") drop(operation.value!);
      else if (operation.name === "renames") {
        const file = open(standing.get(operation.value!)!.file);
        const old = file.blocks.find((b) => b.slug === operation.value)!;
        const [, , ...rest] = old.text.split("\n\n");
        const tags = old.text
          .split("\n\n")[1]!
          .replace(/@origin:\S+/, `@origin:${origin}`);
        old.text = [text.split("\n\n")[0], tags, ...rest].join("\n\n");
        old.slug = block.slug;
      } else {
        const target = tagOf(block, "topic")
          ? home(block)
          : standing.get(operation.value!)!.file;
        const file = open(standing.get(operation.value!)!.file);
        const at = file.blocks.findIndex((b) => b.slug === operation.value);
        if (target === standing.get(operation.value!)!.file)
          file.blocks[at] = { slug: block.slug, text };
        else {
          file.blocks.splice(at, 1);
          open(target).blocks.push({ slug: block.slug, text });
        }
      }
    }
    const before = new Map<string, string | undefined>();
    for (const [path, file] of files) {
      const absolute = join(root, path);
      before.set(
        path,
        existsSync(absolute) ? readFileSync(absolute, "utf8") : undefined,
      );
      if (!file.blocks.length) rmSync(absolute, { force: true });
      else {
        mkdirSync(dirname(absolute), { recursive: true });
        const header =
          file.header || `# ${path.split("/").at(-1)!.replace(/\.md$/, "")}`;
        writeFileSync(
          absolute,
          `${[header, ...file.blocks.map((b) => b.text)].join("\n\n")}\n`,
        );
      }
    }
    return before;
  };

  const archiveOne = async (
    root: string,
    name: string,
    date: string,
  ): Promise<Archived> => {
    const stays = (reason: string): Archived => ({
      change: name,
      place: "still active",
      reason,
    });
    const evidence = readEvidence(root, name);
    if (!evidence) return stays("it has no evidence: verify it first");
    if (evidence.verdict !== "verified")
      return stays("its evidence reports it not verified");
    if (evidence.digest !== (await digestOf(root, name)))
      return stays(
        "the change or the product changed since it was verified: verify it again",
      );

    let findings;
    try {
      findings = (await validateChange(root, name)).findings;
    } catch (e) {
      if (e instanceof NotValidatable) return stays(e.message);
      throw e;
    }
    const stale = findings.filter((f) => f.block && TAG_RULES.includes(f.rule));
    for (const f of stale)
      raise(root, name, {
        source: "the archive",
        names: f.block!,
        findings: [f.message],
      });
    if (stale.length)
      return stays(
        `a tag of its plan no longer holds: ${stale.map((f) => f.block).join(", ")}`,
      );
    if (findings.length)
      return stays(`validation reports it not ready: ${findings[0]!.message}`);

    const plan = parsePlan(readChange(root, name)!.plan!);
    const as = `${date}-${name}`;
    const before = new Map([
      ...consolidate(
        root,
        plan.decisions,
        "Decision",
        as,
        readChange(root, name)?.product,
      ),
      ...consolidate(root, plan.procedures, "Procedure", as),
    ]);
    const merged = openspec(root, ["archive", name, "-y"]);
    const moved = `${today()}-${name}`;
    if (
      merged.status !== 0 ||
      !existsSync(join(root, CHANGES, "archive", moved))
    ) {
      for (const [path, content] of before)
        if (content === undefined) rmSync(join(root, path), { force: true });
        else writeFileSync(join(root, path), content);
      return stays(
        `the specification tool did not archive it:\n${merged.output}`,
      );
    }
    if (moved !== as)
      renameSync(
        join(root, CHANGES, "archive", moved),
        join(root, CHANGES, "archive", as),
      );
    return { change: name, place: "archived", as };
  };

  /**
   * Archives the change `name`, or every active change when none is named, oldest first: a change
   * whose evidence reports it verified has its plan's tags applied to the consolidated decisions and
   * procedures, its delta specs merged by the specification tool, and its folder moved to the archive.
   * Any other stays active. The generated tests are then written again from the merged specs.
   */
  const archive = async (
    root: string,
    name?: string,
    { date = today() }: { date?: string } = {},
  ): Promise<Archived[]> => {
    const names = name
      ? [name]
      : activeChanges(root)
          .map((n) => ({ n, created: readChange(root, n)?.created ?? "" }))
          .sort(
            (a, b) =>
              a.created.localeCompare(b.created) || a.n.localeCompare(b.n),
          )
          .map((c) => c.n);
    const report: Archived[] = [];
    for (const n of names)
      report.push(
        activeChanges(root).includes(n)
          ? await archiveOne(root, n, date)
          : {
              change: n,
              place: "still active",
              reason: "no active change has that name",
            },
      );
    if (report.some((r) => r.place === "archived")) self(root, ["generate"]);
    return report;
  };
  return { archive };
};
