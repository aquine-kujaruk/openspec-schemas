import ts from "typescript";
import type { AuditAcl } from "../acl/audit.acl.ts";
type AuditSpan = ReturnType<AuditAcl["outlineSource"]>[number];

type Span = { from: number; to: number; label: string };

type Parsed = { sf: ts.SourceFile; lines: number };

const parse = (path: string, source: string): Parsed => ({
  sf: ts.createSourceFile(
    path,
    source,
    ts.ScriptTarget.Latest,
    true,
    path.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
  ),
  lines: source.split("\n").length,
});

const line = (sf: ts.SourceFile, pos: number) =>
  sf.getLineAndCharacterOfPosition(pos).line + 1;

const spanOf = (sf: ts.SourceFile, node: ts.Node, label: string): Span => ({
  from: line(sf, node.getStart(sf)),
  to: line(sf, node.getEnd()),
  label,
});

const nameOf = (node: ts.Node): string => {
  const n = (node as { name?: ts.Node }).name;

  return n &&
    (ts.isIdentifier(n) || ts.isStringLiteral(n) || ts.isPrivateIdentifier(n))
    ? n.text
    : "";
};

const kindOf = (node: ts.Node): string => {
  if (ts.isClassDeclaration(node)) return "class";
  if (ts.isInterfaceDeclaration(node)) return "interface";
  if (ts.isFunctionDeclaration(node)) return "function";
  if (ts.isTypeAliasDeclaration(node)) return "type";
  if (ts.isEnumDeclaration(node)) return "enum";
  if (ts.isVariableStatement(node)) return "const";
  if (ts.isMethodDeclaration(node)) return "method";
  if (ts.isConstructorDeclaration(node)) return "constructor";
  if (ts.isGetAccessor(node) || ts.isSetAccessor(node)) return "accessor";
  if (ts.isPropertyDeclaration(node)) return "property";

  if (ts.isPropertySignature(node) || ts.isMethodSignature(node))
    return "member";

  if (ts.isImportDeclaration(node)) return "import";

  if (ts.isExportDeclaration(node) || ts.isExportAssignment(node))
    return "export";

  return "statement";
};

const labelOf = (node: ts.Node, owner?: string): string => {
  const kind = kindOf(node);

  const name = ts.isVariableStatement(node)
    ? node.declarationList.declarations.map(nameOf).filter(Boolean).join(", ")
    : nameOf(node);

  const qualified =
    kind === "constructor"
      ? (owner ?? "")
      : owner && name
        ? `${owner}.${name}`
        : name;

  return qualified ? `${kind} ${qualified}` : kind;
};

const unitsOf = ({ sf }: Parsed): Array<Span & { node: ts.Node }> =>
  sf.statements
    .filter((s) => !ts.isImportDeclaration(s))
    .map((s) => ({ ...spanOf(sf, s, labelOf(s)), node: s }));

const bodyOf = (node: ts.Node): ts.Block | undefined => {
  const body = (node as { body?: ts.Node }).body;

  return body && ts.isBlock(body) ? body : undefined;
};

const functionBody = (node: ts.Node): ts.Block | undefined => {
  if (ts.isFunctionLike(node)) return bodyOf(node);

  if (ts.isVariableStatement(node)) {
    const inits = node.declarationList.declarations.flatMap((d) =>
      d.initializer ? [d.initializer] : [],
    );

    const fn = inits.find(
      (i) => ts.isArrowFunction(i) || ts.isFunctionExpression(i),
    );

    return fn && bodyOf(fn);
  }

  return undefined;
};

const statementsWithin = (node: ts.Node): ts.Node[] => {
  const out: ts.Node[] = [];

  const visit = (n: ts.Node) => {
    if (ts.isBlock(n) || ts.isModuleBlock(n)) out.push(...n.statements);
    else if (ts.isCaseBlock(n))
      n.clauses.forEach((c) => out.push(...c.statements));
    else if (ts.isSourceFile(n) || n === node) n.forEachChild(visit);
    else if (
      ts.isIfStatement(n) ||
      ts.isIterationStatement(n, false) ||
      ts.isTryStatement(n)
    )
      out.push(n);
    else if (ts.isCatchClause(n) || ts.isCaseClause(n) || ts.isDefaultClause(n))
      n.forEachChild(visit);
    else if (ts.isStatement(n)) out.push(n);
  };

  node.forEachChild(visit);

  return out;
};

const partsOf = (
  { sf }: Parsed,
  unit: { node: ts.Node; label: string },
): Array<Span & { node: ts.Node }> => {
  const { node } = unit;
  const owner = nameOf(node);

  if (ts.isClassDeclaration(node) || ts.isClassExpression(node)) {
    const members = node.members.map((m) => ({
      ...spanOf(sf, m, labelOf(m, owner)),
      node: m,
    }));

    if (!members.length) return [];

    const header: Span & { node: ts.Node } = {
      from: line(sf, node.getStart(sf)),
      to: Math.max(line(sf, node.getStart(sf)), members[0].from - 1),
      label: `header of class ${owner}`,
      node,
    };

    return [header, ...members];
  }

  if (
    ts.isInterfaceDeclaration(node) ||
    ts.isEnumDeclaration(node) ||
    ts.isTypeLiteralNode(node)
  )
    return node.members.map((m) => ({
      ...spanOf(sf, m, labelOf(m, owner)),
      node: m,
    }));

  const body = functionBody(node);
  const statements = body ? [...body.statements] : statementsWithin(node);

  return statements.map((s) => ({ ...spanOf(sf, s, labelOf(s)), node: s }));
};

export const outlineSource: AuditAcl["outlineSource"] = ({ path, content }) => {
  const source = parse(path, content);

  const outline = (span: Span & { node: ts.Node }): AuditSpan => ({
    from: span.from,
    to: span.to,
    label: span.label,
    parts: partsOf(source, span)
      .filter((part) =>
        part.from >= span.from && part.to <= span.to &&
        (part.from !== span.from || part.to !== span.to))
      .map(outline),
  });

  return unitsOf(source).map(outline);
};
