import type { FileInfo } from "archunit";
import { dirname, posix } from "node:path";
import type { Rule, RuleContext } from "../../shared/domain/types.ts";

export const has = (re: RegExp) => (file: FileInfo) => re.test(file.content);
export const not = (re: RegExp) => (file: FileInfo) => !re.test(file.content);

/** `invoice-book` → `InvoiceBook`. */
export const pascal = (kebab: string): string =>
  kebab.replace(/(^|-)([a-z0-9])/g, (_, __, c: string) => c.toUpperCase());

/** The index just past the string literal that opens at `i` (its closing quote), escapes skipped. */
const skipString = (text: string, i: number): number => {
  const quote = text[i]!;
  for (i++; i < text.length && text[i] !== quote; i++)
    if (text[i] === "\\") i++;
  return i;
};

const isQuote = (c: string) => c === '"' || c === "'" || c === "`";

/** The index of the bracket that closes the one at `open` (`(`, `{`, `[` or `<`), or -1. Strings and comments are skipped. */
const closing = (text: string, open: number): number => {
  const pairs: Record<string, string> = {
    "(": ")",
    "{": "}",
    "[": "]",
    "<": ">",
  };
  const stack: string[] = [pairs[text[open]!]!];
  for (let i = open + 1; i < text.length; i++) {
    const c = text[i]!;
    if (isQuote(c)) i = skipString(text, i);
    else if (c === "/" && text[i + 1] === "/") i = text.indexOf("\n", i);
    else if (c === "/" && text[i + 1] === "*") i = text.indexOf("*/", i) + 1;
    else if (c in pairs) stack.push(pairs[c]!);
    else if (c === stack.at(-1)) {
      stack.pop();
      if (!stack.length) return i;
    }
    if (i < 0) return -1;
  }
  return -1;
};

/** Splits `text` at the commas outside brackets and strings. */
const topLevelSplit = (text: string): string[] => {
  const parts: string[] = [];
  let depth = 0;
  let start = 0;
  for (let i = 0; i < text.length; i++) {
    const c = text[i]!;
    if (isQuote(c)) i = skipString(text, i);
    else if ("({[<".includes(c)) depth++;
    else if (")}]>".includes(c)) depth--;
    else if (c === "," && depth === 0) {
      parts.push(text.slice(start, i));
      start = i + 1;
    }
  }
  parts.push(text.slice(start));
  return parts.map((p) => p.trim()).filter(Boolean);
};

/** A constructor parameter: its name and declared type (`undefined` when it declares none). */
export type Param = { name: string; type?: string };

/** The parameters of every `constructor(` in `content`, in order, modifiers and defaults dropped. */
export const constructorParams = (content: string): Param[][] => {
  const all: Param[][] = [];
  for (const m of content.matchAll(/\bconstructor\s*\(/g)) {
    const open = m.index + m[0].length - 1;
    const close = closing(content, open);
    if (close < 0) continue;
    all.push(
      topLevelSplit(content.slice(open + 1, close)).map((p) => {
        const bare = p.replace(
          /^(?:(?:public|private|protected|readonly|override)\s+)*/,
          "",
        );
        const name = /^(\w+)/.exec(bare)?.[1] ?? "";
        const typed = /^\w+\s*\??\s*:\s*([\s\S]+)$/.exec(bare)?.[1];
        const type =
          typed && topLevelSplit(typed.replace(/\s*=[\s\S]*$/, ""))[0]?.trim();
        return { name, type };
      }),
    );
  }
  return all;
};

/** The body of the first `constructor` in `content` (without its braces), or `undefined`. */
export const constructorBody = (content: string): string | undefined => {
  const m = /\bconstructor\s*\(/.exec(content);
  if (!m) return undefined;
  const params = closing(content, m.index + m[0].length - 1);
  const open = content.indexOf("{", params);
  const close = closing(content, open);
  return params < 0 || open < 0 || close < 0
    ? undefined
    : content.slice(open + 1, close);
};

/** Every `throw new X(` in `content`: the class and the text of its arguments. */
export const throws = (
  content: string,
): Array<{ name: string; args: string }> =>
  [...content.matchAll(/\bthrow\s+new\s+(\w+)\s*\(/g)].map((m) => {
    const open = m.index + m[0].length - 1;
    const close = closing(content, open);
    return {
      name: m[1]!,
      args: close < 0 ? "" : content.slice(open + 1, close),
    };
  });

/** A named import: the names it binds and where it resolves to (relative specifiers resolved from `path`, bare ones kept). */
export type Import = { names: string[]; specifier: string; resolved: string };

/** The `import { … } from "…"` statements of a file, each with its specifier resolved from the file's folder. */
export const importsOf = (file: Pick<FileInfo, "path" | "content">): Import[] =>
  [
    ...file.content.matchAll(
      /import\s+(?:type\s+)?\{([^}]*)\}\s*from\s*["']([^"']+)["']/g,
    ),
  ].map(([, names, specifier]) => ({
    names: names!
      .split(",")
      .map((n) =>
        n
          .trim()
          .replace(/^type\s+/, "")
          .split(/\s+as\s+/)
          .pop()!
          .trim(),
      )
      .filter(Boolean),
    specifier: specifier!,
    resolved: specifier!.startsWith(".")
      ? posix.normalize(posix.join(dirname(file.path), specifier!))
      : specifier!,
  }));

/** `content` without its comments and string literals, so a word search finds code only. */
export const codeOnly = (content: string): string =>
  content
    .replace(/\/\*[\s\S]*?\*\//g, " ")
    .replace(/\/\/[^\n]*/g, " ")
    .replace(/`(?:\\[\s\S]|[^`\\])*`/g, '""')
    .replace(/"(?:\\.|[^"\\\n])*"/g, '""')
    .replace(/'(?:\\.|[^'\\\n])*'/g, '""');

/** A class declaration read from its header: `[export] [abstract] class Name [extends Base] [implements I, J] {`. */
export type ClassDecl = {
  name: string;
  exported: boolean;
  abstract: boolean;
  extends?: string;
  implements: string[];
};

/** Class declarations of a file. Generic arguments are dropped; a header the regex cannot read reaches nothing. */
export const classesOf = (content: string): ClassDecl[] =>
  [
    ...content.matchAll(
      /^[ \t]*(export\s+)?(?:default\s+)?(abstract\s+)?class\s+(\w+)([^{]*)\{/gm,
    ),
  ].map(([, exported, abstract, name, rest]) => {
    let header = rest!;
    while (/<[^<>]*>/.test(header)) header = header.replace(/<[^<>]*>/g, "");
    return {
      name: name!,
      exported: !!exported,
      abstract: !!abstract,
      extends: /\bextends\s+(\w+)/.exec(header)?.[1],
      implements: (/\bimplements\s+([\w\s,.]+)$/.exec(header.trim())?.[1] ?? "")
        .split(",")
        .map((n) => n.trim())
        .filter(Boolean),
    };
  });

/** Closed vocabulary of a layer: only those folders, each with its file suffix (empty suffix: no rule). */
export const vocabularyRules =
  (
    id: string,
    layer: string,
    modules: string,
    vocabulary: Record<string, string>,
  ) =>
  (ctx: RuleContext): Rule[] => {
    const folders = Object.keys(vocabulary);
    return [
      {
        id,
        title: `${layer} only contains ${folders.join("|")}`,
        check: () =>
          ctx
            .files()
            .inFolder(`${modules}/${layer}/**`)
            .should()
            .beInPath(new RegExp(`/${layer}/(${folders.join("|")})/`))
            .check(ctx.opts),
      },
      ...Object.entries(vocabulary)
        .filter(([, suffix]) => suffix)
        .map(([folder, suffix]) => ({
          id,
          title: `${layer}/${folder}: files *.${suffix}`,
          check: () =>
            ctx
              .files()
              .inFolder(`${modules}/${layer}/${folder}/**`)
              .should()
              .haveName(new RegExp(`\\.${suffix.replace(".", "\\.")}$`))
              .check(ctx.opts),
        })),
    ];
  };

/** A check that passes for every file under the folder `skip` (relative to the module), so a layer can stop where another begins. */
const outside =
  (skip: string | undefined, check: (file: FileInfo) => boolean) =>
  (file: FileInfo): boolean =>
    (skip !== undefined && file.path.includes(`/${skip}/`)) || check(file);

/** Names that say nothing about a role (infrastructure-names-the-role). */
const ROLELESS_CLASS = /(Service|Helper|Utils?|Manager|Common)(?=[A-Z]|$)/;
const ROLELESS_FILE =
  /(^|[-.])(service|helper|utils?|manager|common)(?=[-.]|$)/;

/** infrastructure-names-the-role over `${modules}/${folder}`, leaving out `skip`. */
export const namesTheRoleRule =
  (folder: string, modules: string, skip?: string) =>
  (ctx: RuleContext): Rule => ({
    id: "infrastructure-names-the-role",
    title: `no exported class and no file of ${folder} is named Service, Helper, Util, Utils, Manager or Common`,
    check: () =>
      ctx
        .files()
        .inFolder(`${modules}/${folder}/**`)
        .should()
        .adhereTo(
          outside(
            skip,
            (f) =>
              !ROLELESS_FILE.test(f.name) &&
              classesOf(f.content)
                .filter((c) => c.exported)
                .every((c) => !ROLELESS_CLASS.test(c.name)),
          ),
          "[infrastructure-names-the-role] name the object by what it does (Paginator, Retrier) in the folder the configuration declares for its role",
        )
        .check(ctx.opts),
  });

/** infrastructure-throws-domain-exceptions over `${modules}/${folder}`, leaving out `skip`. */
export const throwsDomainExceptionsRule =
  (folder: string, modules: string, skip?: string) =>
  (ctx: RuleContext): Rule => ({
    id: "infrastructure-throws-domain-exceptions",
    title: `every \`throw new X(\` in ${folder} constructs an exception of its own module (or ValidationException from shared) and passes \`cause\``,
    check: () =>
      ctx
        .files()
        .inFolder(`${modules}/${folder}/**`)
        .should()
        .adhereTo(
          outside(skip, (f) => {
            const root = modules.replace(/\/\*$/, "");
            const module = f.path.slice(root.length + 1).split("/")[0];
            const own = new RegExp(
              `^${root}/${module}/domain/exceptions/[\\w-]+\\.exceptions$`,
            );
            const shared = new RegExp(
              `^${root}/shared/domain/exceptions/[\\w-]+\\.exceptions$`,
            );
            const domainExceptions = new Set(
              importsOf(f).flatMap((i) =>
                own.test(i.resolved)
                  ? i.names
                  : shared.test(i.resolved)
                    ? i.names.filter((n) => n === "ValidationException")
                    : [],
              ),
            );
            return throws(f.content).every(
              (t) => domainExceptions.has(t.name) && /\bcause\b/.test(t.args),
            );
          }),
          "[infrastructure-throws-domain-exceptions] throw an exception of this module's family (imported from its domain/exceptions; from shared only ValidationException) with the caught error as `cause`",
        )
        .check(ctx.opts),
  });
