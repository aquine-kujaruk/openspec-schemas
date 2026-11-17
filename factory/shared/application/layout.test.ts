import { readdirSync, readFileSync, existsSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import ts from "typescript";
import { describe, expect, it } from "vitest";
import { PACKAGE_ROOT } from "../infrastructure/adapters/paths.ts";

const MODULES = ["architecture", "flow", "package", "repository", "shared"];
const MAY_IMPORT: Record<string, string[]> = {
  shared: [],
  repository: [],
  flow: ["repository"],
  architecture: ["repository", "flow"],
  package: ["repository", "flow"],
};
const MAY_IMPORT_LAYER: Record<string, string[]> = {
  domain: ["domain"],
  application: ["domain"],
  infrastructure: ["application", "domain"],
  framework: ["application", "domain"],
};
const walk = (dir: string): string[] =>
  readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? walk(join(dir, e.name)) : [join(dir, e.name)],
  );
const source = (file: string) =>
  ts.createSourceFile(
    file,
    readFileSync(file, "utf8"),
    ts.ScriptTarget.Latest,
    true,
  );
const production = walk(join(PACKAGE_ROOT, "factory")).filter(
  (f) => f.endsWith(".ts") && !/\.(test|steps)\.ts$/.test(f),
);
const imports = (file: string): Array<{ path: string; type: boolean }> => {
  const found: Array<{ path: string; type: boolean }> = [];
  const visit = (n: ts.Node): void => {
    if (
      (ts.isImportDeclaration(n) || ts.isExportDeclaration(n)) &&
      n.moduleSpecifier &&
      ts.isStringLiteral(n.moduleSpecifier)
    )
      found.push({
        path: n.moduleSpecifier.text,
        type: ts.isImportDeclaration(n)
          ? Boolean(n.importClause?.isTypeOnly)
          : n.isTypeOnly,
      });
    if (
      ts.isCallExpression(n) &&
      n.expression.kind === ts.SyntaxKind.ImportKeyword &&
      n.arguments[0] &&
      ts.isStringLiteral(n.arguments[0])
    )
      found.push({ path: n.arguments[0].text, type: false });
    if (
      ts.isImportTypeNode(n) &&
      ts.isLiteralTypeNode(n.argument) &&
      ts.isStringLiteral(n.argument.literal)
    )
      found.push({ path: n.argument.literal.text, type: true });
    ts.forEachChild(n, visit);
  };
  visit(source(file));
  return found;
};

describe("the factory follows the clean core", () => {
  it("holds only composition entries, the modules and the SDK", () => {
    expect(readdirSync(join(PACKAGE_ROOT, "factory")).sort()).toEqual(
      ["main.ts", "sdk", ...MODULES, ...MODULES.map((m) => `${m}.ts`)].sort(),
    );
    for (const module of MODULES) {
      for (const entry of readdirSync(join(PACKAGE_ROOT, "factory", module), {
        withFileTypes: true,
      })) {
        if (entry.isDirectory())
          expect(Object.keys(MAY_IMPORT_LAYER), module).toContain(entry.name);
        else
          expect(entry.name, module).toMatch(/\.feature\.(?:steps|test)\.ts$/);
      }
      const infra = join(PACKAGE_ROOT, "factory", module, "infrastructure");
      if (existsSync(infra))
        for (const folder of readdirSync(infra))
          expect(["acl", "repository-implementations", "adapters"]).toContain(
            folder,
          );
    }
  });

  it("keeps every import in its layer and module direction, including type imports", () => {
    for (const file of production) {
      const [module, layer] = relative(
        join(PACKAGE_ROOT, "factory"),
        file,
      ).split("/");
      if (!module || !layer || module === "sdk") continue; // entry files compose the layers
      for (const dependency of imports(file)) {
        if (!dependency.path.startsWith(".")) continue;
        const target = resolve(dirname(file), dependency.path);
        expect(existsSync(target), `${file}: ${dependency.path}`).toBe(true);
        const [other, targetLayer] = relative(
          join(PACKAGE_ROOT, "factory"),
          target,
        ).split("/");
        expect(
          MAY_IMPORT_LAYER[layer!] ?? [],
          `${file} imports ${dependency.path}`,
        ).toContain(targetLayer);
        if (other !== module && other !== "shared") {
          expect(
            MAY_IMPORT[module!] ?? [],
            `${file} imports ${other}`,
          ).toContain(other);
          expect(["application", "domain"]).toContain(targetLayer);
        }
      }
    }
  });

  it("keeps direct environmental access in resource adapters", () => {
    for (const file of production) {
      const local = relative(join(PACKAGE_ROOT, "factory"), file);
      if (
        !local.includes("/") ||
        local.includes("/infrastructure/adapters/") ||
        local.startsWith("sdk/")
      )
        continue;
      for (const dependency of imports(file))
        if (!dependency.type)
          expect(dependency.path, local).not.toMatch(
            /^(?:node:)?(?:fs(?:\/promises)?|child_process|os|process|http|https|net|tls|dns|worker_threads)$/,
          );
      const visit = (n: ts.Node): void => {
        if (ts.isTypeNode(n)) return;
        if (
          ts.isIdentifier(n) &&
          ["process", "fetch", "WebSocket"].includes(n.text)
        )
          expect(false, `${local} directly uses ${n.text}`).toBe(true);
        ts.forEachChild(n, visit);
      };
      visit(source(file));
    }
  });

  it("has no source-file cycle", () => {
    const graph = new Map(
      production.map((f) => [
        f,
        imports(f)
          .filter((i) => i.path.startsWith("."))
          .map((i) => resolve(dirname(f), i.path)),
      ]),
    );
    const visiting = new Set<string>(),
      visited = new Set<string>();
    const visit = (file: string): void => {
      expect(visiting.has(file), `cycle at ${file}`).toBe(false);
      if (visited.has(file)) return;
      visiting.add(file);
      for (const dependency of graph.get(file) ?? []) visit(dependency);
      visiting.delete(file);
      visited.add(file);
    };
    for (const file of production) visit(file);
  });

  it("keeps schemas and packages on the SDK and the SDK a facade", () => {
    for (const dir of ["schemas", "packages"])
      for (const file of walk(join(PACKAGE_ROOT, dir)).filter((f) =>
        f.endsWith(".ts"),
      ))
        for (const dependency of imports(file)) {
          expect(dependency.path).not.toMatch(/toolkit\/|\.\.\/factory\//);
          if (dependency.path.startsWith("factory"))
            expect(dependency.path).toBe("factory/sdk");
        }
    for (const node of source(join(PACKAGE_ROOT, "factory/sdk/index.ts"))
      .statements)
      expect(ts.isExportDeclaration(node)).toBe(true);
    for (const tool of ["build", "release", "proof", "expect"])
      expect(existsSync(join(PACKAGE_ROOT, "tools", `${tool}.ts`))).toBe(true);
  });
});
