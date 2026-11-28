import { spawnSync } from "node:child_process";
import { cpSync, mkdirSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { expect, onTestFinished } from "vitest";
import { parse } from "yaml";
import { repository } from "./build.feature.steps.ts";
import { PACKAGE_ROOT } from "../factory/shared/infrastructure/adapters/paths.adapter.ts";
import { release } from "./release.ts";

/**
 * Each scenario releases from a git repository of its own, laid out as this one (the build's
 * fixture), whose package manifests are the ones the scenario names. A release published before is
 * written by hand onto the `packages` branch, as an earlier release would have left it.
 */
const module = (value: unknown) =>
  `export default ${JSON.stringify(value, null, 2)};\n`;
const list = (value: string): string[] =>
  value === "none" ? [] : value.split(", ");

export function createSteps() {
  const root = repository();
  const git = (...args: string[]): string => {
    const ran = spawnSync("git", args, { cwd: root, encoding: "utf8" });
    if (ran.status !== 0)
      throw new Error(`git ${args.join(" ")}: ${ran.stderr}`);
    return ran.stdout.trim();
  };
  const tip = (ref: string): string => git("rev-parse", `${ref}^{commit}`);
  let packages: string[] = [];
  const before = new Map<string, string>();
  let exited: number | undefined;
  let previousVersion: string;
  const run = (cwd: string, command: string, args: string[]) =>
    spawnSync(command, args, {
      cwd,
      encoding: "utf8",
      env: {
        ...process.env,
        CI: "",
        GITHUB_ACTIONS: "",
        GH_TOKEN: "",
        GITHUB_TOKEN: "",
      },
    });
  const checked = (cwd: string, command: string, args: string[]): string => {
    const result = run(cwd, command, args);
    expect(result.status, result.stdout + result.stderr).toBe(0);
    return result.stdout.trim();
  };
  const publisher = ".github/scripts/publish-release.sh";
  const releaseTools = ".github/release";
  const remote = join(root, ".git", "release-origin.git");
  const recover = (tag: string) => {
    const checkout = join(root, ".git", "recovery");
    checked(root, "git", ["clone", "--branch", "main", remote, checkout]);
    symlinkSync(join(PACKAGE_ROOT, "node_modules"), join(checkout, "node_modules"));
    checked(checkout, "git", ["config", "user.name", "Release fixture"]);
    checked(checkout, "git", ["config", "user.email", "release@fixture.invalid"]);
    checked(checkout, "git", ["switch", "--detach", `refs/tags/${tag}`]);
    checked(checkout, "bash", [publisher, tag]);
    expect(checked(checkout, "bash", [publisher, tag])).toContain("is already published");
  };

  return {
    // Context
    async repositoryAtVersion(
      version: string,
      manifests: string,
    ): Promise<void> {
      packages = list(manifests);
      writeFileSync(
        join(root, "package.json"),
        JSON.stringify({ name: "fixture", version }),
      );
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
            project: {
              testRunner: "vitest",
              typeChecker: { name: "typescript", version: "7.0.2" },
            },
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
        spawnSync("git", args, {
          cwd: root,
          input,
          encoding: "utf8",
        }).stdout.trim();
      for (const ref of list(published)) {
        const version = ref.replace(/^packages-v/, "");
        const manifest = object(
          ["hash-object", "-w", "--stdin"],
          `name: backend\nversion: ${version}\n`,
        );
        const folder = object(["mktree"], `100644 blob ${manifest}\tapm.yml\n`);
        const tree = object(["mktree"], `040000 tree ${folder}\tbackend\n`);
        const branched =
          spawnSync(
            "git",
            ["rev-parse", "-q", "--verify", "refs/heads/packages"],
            { cwd: root },
          ).status === 0;
        const parent = branched ? ["-p", "packages"] : [];
        const commit = git(
          "commit-tree",
          tree,
          ...parent,
          "-m",
          `release ${version}`,
        );
        git("update-ref", "refs/heads/packages", commit);
        git("tag", ref, commit);
        before.set(ref, tip(ref));
      }
    },
    async latestSourceRelease(previous: string): Promise<void> {
      onTestFinished(() => rmSync(root, { recursive: true, force: true }));
      previousVersion = previous;
      await this.repositoryAtVersion(previous, "backend");
      await this.releasesPublished(`packages-v${previous}`);
      mkdirSync(join(root, ".github", "scripts"), { recursive: true });
      mkdirSync(join(root, releaseTools), { recursive: true });
      const config = join(releaseTools, "config.mjs");
      for (const file of [".releaserc.json", config, publisher]) {
        cpSync(join(PACKAGE_ROOT, file), join(root, file));
      }
      git("add", ".releaserc.json", config, publisher);
      git("commit", "-m", "chore: configure releases");
      symlinkSync(join(PACKAGE_ROOT, "node_modules"), join(root, "node_modules"));
      symlinkSync(join(PACKAGE_ROOT, releaseTools, "node_modules"), join(root, releaseTools, "node_modules"));
      git("tag", `v${previous}`);
      git("init", "--quiet", "--bare", "--initial-branch=main", remote);
      git("remote", "add", "origin", remote);
      git("push", "origin", "main", "packages", `v${previous}`, `packages-v${previous}`);
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
    classifiedChangeMerged(change: string): void {
      const messages = {
        fix: "fix(factory): handle an empty input",
        feature: "feat(factory): inspect packages",
        breaking: "feat(factory)!: change the package contract",
        documentation: "docs: explain the package layout",
      };
      git("switch", "-c", "change");
      git("commit", "--allow-empty", "-m", messages[change as keyof typeof messages]);
      git("switch", "main");
      git("merge", "--no-ff", "change");
      git("push", "origin", "main");

      const hook = join(remote, "hooks", "pre-receive");
      if (change === "fix") {
        writeFileSync(hook, "#!/bin/sh\nwhile read -r old new ref; do\n  test \"$ref\" != refs/heads/packages || exit 1\ndone\n", { mode: 0o755 });
      }
      const result = run(root, join(root, releaseTools, "node_modules", ".bin", "semantic-release"), ["--no-ci"]);
      const output = result.stdout + result.stderr;
      if (change === "fix") {
        expect(result.status, output).toBe(1);
        expect(output).toContain("pre-receive hook declined");
        git("fetch", "--tags", "origin");
        const tag = git("tag", "--list", "v*", "--sort=-version:refname").split("\n")[0]!;
        expect(tag).not.toBe(`v${previousVersion}`);
        expect(git("ls-remote", "--tags", "origin", `refs/tags/packages-${tag}`)).toBe("");
        rmSync(hook);
        git("tag", "-d", `packages-${tag}`);
        recover(tag);
      } else {
        expect(result.status, output).toBe(0);
      }
      git("fetch", "--tags", "origin");
    },

    // Outcome
    async refHoldsPackages(ref: string, packages: string): Promise<void> {
      if (packages === "as published before")
        return expect(tip(ref)).toBe(before.get(ref));
      expect(git("ls-tree", "--name-only", ref).split("\n").sort()).toEqual(
        list(packages).sort(),
      );
    },
    async releasesUnchanged(published: string): Promise<void> {
      for (const ref of list(published)) expect(tip(ref)).toBe(before.get(ref));
    },
    async releaseExitStatus(status: string): Promise<void> {
      expect(exited).toBe(Number(status));
    },
    async releasedPackagesNameVersion(named: string): Promise<void> {
      const ref = git(
        "tag",
        "--list",
        "packages-v*",
        "--sort=-v:refname",
      ).split("\n")[0]!;
      for (const name of packages)
        expect(
          (parse(git("show", `${ref}:${name}/apm.yml`)) as { version: string })
            .version,
        ).toBe(named);
    },
    async releasedPackagesCommand(command: string): Promise<void> {
      const ref = git(
        "tag",
        "--list",
        "packages-v*",
        "--sort=-v:refname",
      ).split("\n")[0]!;
      for (const name of packages)
        expect(
          git(
            "ls-tree",
            "--name-only",
            `${ref}:${name}/.apm/skills/setup/assets`,
          ),
        ).toContain(`factory-${command}.tgz`);
    },
    automaticReleaseOutcome(result: string): void {
      const sourceTags = git("tag", "--list", "v*").split("\n");
      const packageTags = git("tag", "--list", "packages-v*").split("\n");
      expect(tip(`packages-v${previousVersion}`)).toBe(before.get(`packages-v${previousVersion}`));
      if (result === `the released version stays at ${previousVersion}`) {
        expect(sourceTags).toEqual([`v${previousVersion}`]);
        expect(packageTags).toEqual([`packages-v${previousVersion}`]);
        return;
      }

      const [sourceTag, packageTag] = result.split(" and ") as [string, string];
      const version = sourceTag.slice(1);
      expect(sourceTags).toHaveLength(2);
      expect(packageTags).toHaveLength(2);
      expect(tip(sourceTag)).toBe(tip("origin/main"));
      expect(JSON.parse(git("show", `${sourceTag}:package.json`)).version).toBe(version);
      expect(parse(git("show", `${packageTag}:backend/apm.yml`)).version).toBe(version);
      expect(git("ls-tree", "--name-only", `${packageTag}:backend/.apm/skills/setup/assets`))
        .toContain(`factory-${version}.tgz`);
    },
  };
}
