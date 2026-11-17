import { spawnSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { expect } from "vitest";
import { parse } from "yaml";
import { repository } from "./build.feature.steps.ts";
import { release } from "./release.ts";

/**
 * Each scenario releases from a git repository of its own, laid out as this one (the build's
 * fixture), whose package manifests are the ones the scenario names. A release published before is
 * written by hand onto the `packages` branch, as an earlier release would have left it.
 */
const module = (value: unknown) => `export default ${JSON.stringify(value, null, 2)};\n`;
const list = (value: string): string[] => (value === "none" ? [] : value.split(", "));

export function createSteps() {
  const root = repository();
  const git = (...args: string[]): string => {
    const ran = spawnSync("git", args, { cwd: root, encoding: "utf8" });
    if (ran.status !== 0) throw new Error(`git ${args.join(" ")}: ${ran.stderr}`);
    return ran.stdout.trim();
  };
  const tip = (ref: string): string => git("rev-parse", `${ref}^{commit}`);
  let packages: string[] = [];
  const before = new Map<string, string>();
  let exited: number | undefined;

  return {
    // Context
    async repositoryAtVersion(version: string, manifests: string): Promise<void> {
      packages = list(manifests);
      writeFileSync(join(root, "package.json"), JSON.stringify({ name: "fixture", version }));
      mkdirSync(join(root, "packages"), { recursive: true });
      for (const name of packages)
        writeFileSync(
          join(root, "packages", `${name}.ts`),
          module({
            name,
            description: `The ${name} package`,
            schemas: ["spec-plan"],
            agents: ["claude", "codex"],
            tools: {},
            skills: [],
            languageServers: [],
            packageManager: { name: "apm", version: "0.35.1" },
            project: { testRunner: "vitest", typeChecker: { name: "typescript", version: "7.0.2" } },
          }),
        );
      git("init", "--quiet", "--initial-branch", "main");
      git("config", "user.name", "Release fixture");
      git("config", "user.email", "release@fixture.invalid");
      git("add", "--all");
      git("commit", "--quiet", "--message", "the repository");
    },
    async releasesPublished(published: string): Promise<void> {
      const object = (args: string[], input: string): string =>
        spawnSync("git", args, { cwd: root, input, encoding: "utf8" }).stdout.trim();
      for (const ref of list(published)) {
        const version = ref.replace(/^packages-v/, "");
        const manifest = object(["hash-object", "-w", "--stdin"], `name: backend\nversion: ${version}\n`);
        const folder = object(["mktree"], `100644 blob ${manifest}\tapm.yml\n`);
        const tree = object(["mktree"], `040000 tree ${folder}\tbackend\n`);
        const branched = spawnSync("git", ["rev-parse", "-q", "--verify", "refs/heads/packages"], { cwd: root }).status === 0;
        const parent = branched ? ["-p", "packages"] : [];
        const commit = git("commit-tree", tree, ...parent, "-m", `release ${version}`);
        git("update-ref", "refs/heads/packages", commit);
        git("tag", ref, commit);
        before.set(ref, tip(ref));
      }
    },

    // Action
    async releasePackages(): Promise<void> {
      try {
        await release(root);
        exited = 0;
      } catch {
        exited = 1;
      }
    },

    // Outcome
    async refHoldsPackages(ref: string, packages: string): Promise<void> {
      if (packages === "as published before") return expect(tip(ref)).toBe(before.get(ref));
      expect(git("ls-tree", "--name-only", ref).split("\n").sort()).toEqual(list(packages).sort());
    },
    async releasesUnchanged(published: string): Promise<void> {
      for (const ref of list(published)) expect(tip(ref)).toBe(before.get(ref));
    },
    async releaseExitStatus(status: string): Promise<void> {
      expect(exited).toBe(Number(status));
    },
    async releasedPackagesNameVersion(named: string): Promise<void> {
      const ref = git("tag", "--list", "packages-v*", "--sort=-v:refname").split("\n")[0]!;
      for (const name of packages)
        expect((parse(git("show", `${ref}:${name}/apm.yml`)) as { version: string }).version).toBe(named);
    },
    async releasedPackagesCommand(command: string): Promise<void> {
      const ref = git("tag", "--list", "packages-v*", "--sort=-v:refname").split("\n")[0]!;
      for (const name of packages)
        expect(git("ls-tree", "--name-only", `${ref}:${name}/.apm/skills/setup/assets`)).toContain(`factory-${command}.tgz`);
    },
  };
}
