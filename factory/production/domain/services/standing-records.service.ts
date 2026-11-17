import { operationsOf, tagOf, tagsOf, type Block } from "../schemas/plan-document.schema.ts";

/** A consolidated block: where it lives and the change that last wrote it. */
export type Standing = {
  file: string;
  origin?: string;
  keys?: string[];
  body: string;
};
/** The consolidated decisions and procedures, by slug. A slug is unique within its tree. */
export type Consolidated = {
  decisions: Map<string, Standing>;
  procedures: Map<string, Standing>;
};

type Kind = "Decision" | "Procedure";

type File = { header: string; blocks: Array<{ slug: string; text: string }> };

const parseStandingFile = (document: string | null, kind: Kind): File => {
  if (document === null) return { header: "", blocks: [] };
  const [header, ...blocks] = document.split(
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


export class StandingRecordsService {
  async revise(
    blocks: Block[],
    kind: Kind,
    origin: string,
    standing: ReadonlyMap<string, { file: string }>,
    read: (path: string) => Promise<string | null>,
    product = "",
  ): Promise<{ path: string; before: string | null; after: string | null }[]> {
    const tree = kind === "Decision" ? "openspec/adr" : "openspec/runbooks";
    const files = new Map<string, { before: string | null; file: File }>();
    const open = async (path: string): Promise<File> => {
      const current = files.get(path);
      if (current) return current.file;
      const before = await read(path);
      const file = parseStandingFile(before, kind);
      files.set(path, { before, file });
      return file;
    };
    const home = (block: Block) => [
      tree,
      kind === "Decision" ? product : "",
      tagOf(block, kind === "Decision" ? "area" : "purpose")?.value ?? "",
      `${tagOf(block, "topic")?.value}.md`,
    ].filter(Boolean).join("/");
    const drop = async (slug: string) => {
      const file = await open(standing.get(slug)!.file);
      file.blocks = file.blocks.filter((b) => b.slug !== slug);
    };
    for (const block of blocks) {
      const operation = operationsOf(block)[0]!;
      const text = consolidated(kind, block, origin);
      if (operation.name === "adds")
        (await open(home(block))).blocks.push({ slug: block.slug, text });
      else if (operation.name === "removes") await drop(operation.value!);
      else if (operation.name === "renames") {
        const file = await open(standing.get(operation.value!)!.file);
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
        const file = await open(standing.get(operation.value!)!.file);
        const at = file.blocks.findIndex((b) => b.slug === operation.value);
        if (target === standing.get(operation.value!)!.file)
          file.blocks[at] = { slug: block.slug, text };
        else {
          file.blocks.splice(at, 1);
          (await open(target)).blocks.push({ slug: block.slug, text });
        }
      }
    }
    return [...files].map(([path, {before, file}]) => ({
      path,
      before,
      after: file.blocks.length
        ? `${file.header || `# ${path.split("/").at(-1)!.replace(/\.md$/, "")}`}\n\n${file.blocks.map(({text}) => text).join("\n\n")}\n`
        : null,
    }));
  }
}

/** Indexes the standing blocks in order. A repeated slug resolves to its last definition. */
export function indexStanding(
  documents: { file: string; document: string }[],
  kind: Kind,
): Map<string, Standing> {
  const blocks = new Map<string, Standing>();
  const heading = new RegExp(`^### ${kind}: (\\S+)`);
  for (const { file, document } of documents) {
    let current: Standing | undefined;
    // A line of a fenced block (a shell comment, say) is never a heading.
    let fenced = false;
    for (const line of document.split("\n")) {
      const slug = fenced ? undefined : heading.exec(line)?.[1];
      if (slug) {
        current = { file, body: "" };
        blocks.set(slug, current);
        continue;
      }
      if (!fenced && line.startsWith("#")) {
        current = undefined;
        continue;
      }
      if (/^\s*(```|~~~)/.test(line)) fenced = !fenced;
      if (current) current.body += `${line}\n`;
      if (current && !fenced && line.trim().startsWith("@")) {
        const tags = tagsOf(line);
        current.origin ??= tags.find((t) => t.name === "origin")?.value;
        const keys = tags.find((t) => t.name === "keys")?.value;
        if (keys) current.keys ??= keys.split(",").filter(Boolean);
      }
    }
  }
  return blocks;
}
