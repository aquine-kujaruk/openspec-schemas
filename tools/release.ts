import {
  cpSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  capture,
  COMMAND,
  PROJECT_ROOT,
} from "../factory/shared/infrastructure/adapters/paths.adapter.ts";
import { build, packageNames } from "./build.ts";

/** What a release published: the repository's version, the ref it published under and the packages there. */
export type Release = { version: string; ref: string; packages: string[] };

/** The branch every release is a commit of, one folder per package. */
export const BRANCH = "packages";

/** The ref a version is published under, which a project installs from. */
export const refOf = (version: string): string => `${BRANCH}-v${version}`;

const git = (cwd: string, ...args: string[]): string => {
  const ran = capture("git", args, { cwd });
  if (ran.status !== 0)
    throw new Error(`git ${args.join(" ")} failed:\n${ran.stderr.trim()}`);
  return ran.stdout.trim();
};
const succeeds = (cwd: string, ...args: string[]): boolean =>
  capture("git", args, { cwd }).status === 0;

/**
 * Builds every package of `root` and commits them, one folder each, onto the `packages` branch,
 * created with no history when it does not exist, tagged `packages-v<version>`. With `push`, it
 * first takes that remote's branch and refuses a ref the remote already has, then pushes both.
 * A ref already published is never rewritten: the release refuses it and publishes nothing.
 */
export const release = async (
  root: string,
  { push }: { push?: string } = {},
): Promise<Release> => {
  const { version } = JSON.parse(
    readFileSync(join(root, "package.json"), "utf8"),
  ) as { version: string };
  const ref = refOf(version);
  if (push) {
    if (git(root, "ls-remote", "--tags", push, ref))
      throw new Error(`${ref} is already published on ${push}`);
    if (git(root, "ls-remote", "--heads", push, BRANCH))
      git(root, "fetch", push, `+${BRANCH}:${BRANCH}`);
  }
  if (succeeds(root, "rev-parse", "-q", "--verify", `refs/tags/${ref}`))
    throw new Error(
      `${ref} is already published: a released version is never rewritten, release a new one`,
    );
  const packages = packageNames(root);
  if (!packages.length) throw new Error("the repository defines no package");

  const out = mkdtempSync(join(tmpdir(), `${COMMAND}-release-`));
  const tree = join(out, "tree");
  try {
    for (const name of packages)
      await build(name, { root, out: join(out, "built") });
    if (succeeds(root, "rev-parse", "-q", "--verify", `refs/heads/${BRANCH}`))
      git(root, "worktree", "add", tree, BRANCH);
    else {
      git(root, "worktree", "add", "--detach", tree);
      git(tree, "checkout", "--orphan", BRANCH);
    }
    for (const entry of readdirSync(tree))
      if (entry !== ".git")
        rmSync(join(tree, entry), { recursive: true, force: true });
    for (const name of packages)
      cpSync(join(out, "built", name), join(tree, name), { recursive: true });
    git(tree, "add", "--all");
    git(tree, "commit", "--quiet", "--message", `release ${version}`);
    git(tree, "tag", ref);
    if (push)
      git(root, "push", push, `refs/heads/${BRANCH}`, `refs/tags/${ref}`);
    return { version, ref, packages };
  } finally {
    capture("git", ["worktree", "remove", "--force", tree], { cwd: root });
    rmSync(out, { recursive: true, force: true });
  }
};

/** `factory release [--push <remote>]`. */
export const run = async (args: string[]): Promise<number> => {
  const flag = args.indexOf("--push");
  const push = flag >= 0 ? args[flag + 1] : undefined;
  if (flag >= 0 && !push) {
    console.error("Name the remote to push to: factory release --push origin");
    return 2;
  }
  try {
    const { ref, packages } = await release(PROJECT_ROOT, { push });
    console.log(
      `released ${ref}: ${packages.join(", ")}${push ? `, pushed to ${push}` : ""}`,
    );
    return 0;
  } catch (e) {
    console.error(e instanceof Error ? e.message : String(e));
    return 1;
  }
};
