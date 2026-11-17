import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { describe, expect, it } from "vitest";
import { readConsolidated } from "../flow/consolidated.ts";
import { codeOf, holdingsOf, runsOf, suspectsOf } from "./suspects.ts";

const needs = (body: string) => runsOf(body).map(({ need }) => need);

describe("the commands a runbook runs", () => {
  it("reads fenced lines and inline spans, and nothing of the prose", () => {
    expect(codeOf("Run `pnpm dev` from pnpm.\n\n```bash\n$ pnpm run seed\n```\n")).toEqual([
      "pnpm dev",
      "$ pnpm run seed",
    ]);
  });

  it("tells a project's script from pnpm's own command", () => {
    expect(needs("`pnpm dev` `pnpm start` `pnpm install` `pnpm add -D vite` `pnpm run build`")).toEqual([
      { kind: "script", name: "dev" },
      { kind: "script", name: "start" },
      { kind: "script", name: "build" },
    ]);
  });

  it("reads npm and yarn scripts", () => {
    expect(needs("`npm run lint` `npm start` `npm install` `yarn dev` `yarn add vite`")).toEqual([
      { kind: "script", name: "lint" },
      { kind: "script", name: "start" },
      { kind: "script", name: "dev" },
    ]);
  });

  it("reads binaries, and leaves a package fetched at a version or through dlx alone", () => {
    expect(needs("`pnpm exec vite` `npx tsc --noEmit` `npx create-vite@5.5.0 web` `pnpm dlx ejs@7.0.2`")).toEqual([
      { kind: "binary", name: "vite" },
      { kind: "binary", name: "tsc" },
    ]);
  });

  it("reads a file given to an interpreter or run by relative path", () => {
    expect(needs("`node scripts/seed.mjs` `tsx src/main.ts` `bash -c 'x'` `./bin/dev.sh --watch`")).toEqual([
      { kind: "file", path: "scripts/seed.mjs" },
      { kind: "file", path: "src/main.ts" },
      { kind: "file", path: "./bin/dev.sh" },
    ]);
  });

  it("splits chained commands, drops leading assignments and skips placeholders", () => {
    expect(needs("`cd web && PORT=3000 pnpm dev | tee log` `pnpm run <script>` `node $ENTRY`")).toEqual([
      { kind: "script", name: "dev" },
    ]);
  });

  it("judges no other tool", () => {
    expect(needs("`kubectl logs deploy/api` `docker compose up` `curl -s localhost:3000`")).toEqual([]);
  });
});

describe("a suspect runbook", () => {
  const project = (files: Record<string, string>) => {
    const root = mkdtempSync(join(tmpdir(), "suspects-"));
    for (const [path, text] of Object.entries(files)) {
      mkdirSync(dirname(join(root, path)), { recursive: true });
      writeFileSync(join(root, path), text);
    }
    return root;
  };

  it("names the procedure, its file, the command and what is missing", () => {
    const root = project({
      "package.json": JSON.stringify({ scripts: { dev: "vite" } }),
      "openspec/runbooks/setup/local-run.md":
        "# local-run\n\n### Procedure: local-run · Run it\n\n@purpose:setup\n\n```bash\n# a comment ends no block\npnpm run start\n```\n",
    });
    expect(suspectsOf(readConsolidated(root).procedures, holdingsOf(root, []))).toEqual([
      "the procedure local-run (openspec/runbooks/setup/local-run.md) runs pnpm run start and no package.json has the script start",
    ]);
  });

  it("finds a script, a binary or a file in a product's folder", () => {
    const root = project({
      "apps/web/package.json": JSON.stringify({ scripts: { dev: "vite" } }),
      "apps/web/node_modules/.bin/vite": "",
      "apps/web/scripts/seed.mjs": "",
      "openspec/runbooks/setup/local-run.md":
        "### Procedure: local-run · Run it\n\n`pnpm dev` `pnpm exec vite` `node scripts/seed.mjs`\n",
    });
    expect(suspectsOf(readConsolidated(root).procedures, holdingsOf(root, ["apps/web"]))).toEqual([]);
    expect(suspectsOf(readConsolidated(root).procedures, holdingsOf(root, []))).toHaveLength(3);
  });
});
