import { spawnSync } from "node:child_process";
import {
  chmodSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { expect } from "vitest";
import { PACKAGE_ROOT } from "../shared/infrastructure/adapters/paths.ts";

/**
 * Each scenario runs this repository's `install.sh` in an empty project, against a local
 * repository holding the releases the scenario names, each a commit of the `packages` branch tagged
 * `packages-v<version>` with every package's setup skill. The machine is a folder of programs on
 * `PATH`: the plain tools the installer uses, and git and Node unless the scenario takes them away.
 * The agent package manager and pnpm are fakes that record what they were asked: the first copies
 * the package's skills from the local repository into each target's folder, the second records the
 * command it is asked to add.
 */
const PACKAGES = ["backend", "frontend", "fullstack"];
const TOOLS = [
  "sh",
  "sed",
  "sort",
  "head",
  "tail",
  "grep",
  "tr",
  "mktemp",
  "rm",
  "ls",
  "mkdir",
  "cp",
  "tar",
  "cat",
  "env",
];
const FOLDER: Record<string, string> = {
  claude: ".claude/skills",
  codex: ".agents/skills",
};

const list = (value: string): string[] =>
  value === "none" ? [] : value.split(", ");
const which = (tool: string): string =>
  spawnSync("sh", ["-c", `command -v ${tool}`], {
    encoding: "utf8",
  }).stdout.trim();
const write = (path: string, text: string, executable = false): void => {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, text);
  if (executable) chmodSync(path, 0o755);
};

const FAKE_APM = `#!/bin/sh
echo "apm $*" >> "$INSTALL_LOG"
[ "$1" = install ] || exit 0
source="$2"; targets="$4"
pkg=$(echo "$source" | sed 's|.*/||; s|#.*||'); ref=$(echo "$source" | sed 's|.*#||')
tmp=$(mktemp -d)
git -C "$FACTORY_REPOSITORY" archive "$ref" "$pkg" | tar -x -C "$tmp"
for target in $(echo "$targets" | tr ',' ' '); do
  case "$target" in claude) dir=.claude/skills ;; codex) dir=.agents/skills ;; *) exit 1 ;; esac
  mkdir -p "$dir" && cp -R "$tmp/$pkg/.apm/skills/." "$dir/"
done
`;
const FAKE_PNPM = `#!/bin/sh
echo "pnpm $*" >> "$INSTALL_LOG"
if [ "$1" = add ]; then echo "$3" > .pinned-command; fi
exit 0
`;
const FAKE_INSTALLER = `#!/bin/sh
echo "apm-installer $*" >> "$INSTALL_LOG"
mkdir -p "$HOME/.local/bin"
cp "$FAKE_APM" "$HOME/.local/bin/apm"
`;

export function createSteps() {
  const base = mkdtempSync(join(tmpdir(), "install-"));
  const releases = join(base, "releases");
  const project = join(base, "project");
  const home = join(base, "home");
  const bin = join(base, "bin");
  const log = join(base, "install.log");
  const absent = new Set<string>();
  let ran:
    | { status: number | null; stdout: string; stderr: string }
    | undefined;
  mkdirSync(project, { recursive: true });
  mkdirSync(home, { recursive: true });
  writeFileSync(
    join(project, "package.json"),
    JSON.stringify({ name: "project" }),
  );
  writeFileSync(log, "");

  const git = (...args: string[]): string => {
    const r = spawnSync("git", args, { cwd: releases, encoding: "utf8" });
    if (r.status !== 0) throw new Error(`git ${args.join(" ")}: ${r.stderr}`);
    return r.stdout.trim();
  };
  const logged = (): string[] =>
    readFileSync(log, "utf8").split("\n").filter(Boolean);
  const installs = (): string[] =>
    logged().filter((l) => l.startsWith("apm install "));

  const install = (args: string[]): void => {
    for (const tool of TOOLS) symlinkSync(which(tool), join(bin, tool));
    if (!absent.has("git")) symlinkSync(which("git"), join(bin, "git"));
    if (absent.has("Node 22.18"))
      write(join(bin, "node"), "#!/bin/sh\necho v20.11.0\n", true);
    else symlinkSync(process.execPath, join(bin, "node"));
    if (!absent.has("pnpm")) write(join(bin, "pnpm"), FAKE_PNPM, true);
    write(join(base, "fake-apm"), FAKE_APM, true);
    if (!absent.has("the agent package manager"))
      write(join(bin, "apm"), FAKE_APM, true);
    write(join(base, "apm-installer"), FAKE_INSTALLER, true);
    const r = spawnSync(
      join(bin, "sh"),
      [join(PACKAGE_ROOT, "install.sh"), ...args],
      {
        cwd: project,
        encoding: "utf8",
        env: {
          PATH: bin,
          HOME: home,
          FACTORY_REPOSITORY: releases,
          APM_INSTALLER: join(base, "apm-installer"),
          FAKE_APM: join(base, "fake-apm"),
          INSTALL_LOG: log,
          GIT_CONFIG_NOSYSTEM: "1",
        },
      },
    );
    ran = { status: r.status, stdout: r.stdout, stderr: r.stderr };
  };

  return {
    // Context
    async releasesPublished(released: string): Promise<void> {
      mkdirSync(releases, { recursive: true });
      mkdirSync(bin, { recursive: true });
      git("init", "--quiet", "--initial-branch", "main");
      git("config", "user.name", "Install fixture");
      git("config", "user.email", "install@fixture.invalid");
      git("commit", "--quiet", "--allow-empty", "--message", "the repository");
      git("checkout", "--quiet", "--orphan", "packages");
      for (const version of list(released)) {
        for (const name of PACKAGES) {
          const assets = join(releases, name, ".apm/skills/setup/assets");
          write(
            join(releases, name, "apm.yml"),
            `name: ${name}\nversion: ${version}\n`,
          );
          write(
            join(releases, name, ".apm/skills/setup/SKILL.md"),
            "# setup\n",
          );
          write(
            join(assets, `factory-${version}.tgz`),
            `the command ${version}\n`,
          );
          write(
            join(assets, "manifest.json"),
            JSON.stringify({
              package: name,
              version,
              command: `factory-${version}.tgz`,
              agents: ["claude", "codex"],
              packageManager: { name: "apm", version: "0.35.1" },
            }),
          );
        }
        git("add", "--all");
        git("commit", "--quiet", "--message", `release ${version}`);
        git("tag", `packages-v${version}`);
      }
      git("checkout", "--quiet", "main");
    },
    async machineLacks(lacking: string): Promise<void> {
      if (lacking !== "nothing") absent.add(lacking);
    },

    // Action
    async installPackageAsking(
      packageStep: string,
      asked: string,
    ): Promise<void> {
      install([
        packageStep,
        ...(asked === "latest" ? [] : ["--version", asked]),
      ]);
    },
    async installPackageForAgents(
      packageStep: string,
      asked: string,
    ): Promise<void> {
      install([
        packageStep,
        ...(asked === "none" ? [] : ["--agents", list(asked).join(",")]),
      ]);
    },

    // Outcome
    async projectHoldsPackage(
      packageStep: string,
      installed: string,
    ): Promise<void> {
      if (installed === "none") return expect(installs()).toEqual([]);
      expect(installs().join("\n")).toContain(
        `/${packageStep}#packages-v${installed}`,
      );
      const manifest = join(
        project,
        ".claude/skills/setup/assets/manifest.json",
      );
      expect(
        (JSON.parse(readFileSync(manifest, "utf8")) as { version: string })
          .version,
      ).toBe(installed);
    },
    async projectDependsOnCommand(installed: string): Promise<void> {
      const pinned = join(project, ".pinned-command");
      if (installed === "none") return expect(existsSync(pinned)).toBe(false);
      expect(readFileSync(pinned, "utf8").trim()).toMatch(
        new RegExp(`/setup/assets/factory-${installed}\\.tgz$`),
      );
      expect(logged()).toContain("pnpm exec factory doctor --fix");
    },
    async installerExitStatus(status: string): Promise<void> {
      expect(ran?.status, ran?.stderr).toBe(Number(status));
    },
    async packageInstalledForAgents(agents: string): Promise<void> {
      if (agents === "none") return expect(installs()).toEqual([]);
      expect(installs()[0]).toMatch(
        new RegExp(`--target ${list(agents).join(",")}$`),
      );
      for (const agent of list(agents))
        expect(
          existsSync(join(project, FOLDER[agent]!, "setup/SKILL.md")),
        ).toBe(true);
    },
    async installerNamesMissing(named: string): Promise<void> {
      if (named === "nothing")
        return expect(ran?.stderr).not.toContain("lacks");
      expect(ran?.stderr).toContain(`lacks: ${named}`);
    },
    async packageManagerIs(packageManager: string): Promise<void> {
      const installer = logged().filter((l) => l.startsWith("apm-installer"));
      if (packageManager === "as it was") return expect(installer).toEqual([]);
      expect(installer).toEqual([
        `apm-installer @v${packageManager.replace("installed at ", "")}`,
      ]);
    },
  };
}
