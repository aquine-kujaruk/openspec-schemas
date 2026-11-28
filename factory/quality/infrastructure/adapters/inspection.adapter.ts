import type { InspectionTools, QualityCheck, InspectionFinding, Check, Layer } from "../acl/inspection.acl.ts";

export const createCheck = ({
  globSync,
  writeFileSync,
  join,
  resolve,
  sep,
  COVERAGE_RULE,
  fallowConfig,
  oxlintConfig,
  fileOf,
  generate,
  withUpstream,
  cacheDir,
  jsonOf,
  PROJECT_ROOT,
  runTool,
  architecture,
  config,
  product,
  archunitRules,
}: InspectionTools): {check: QualityCheck} => {
  type Selection = { layers: Layer[]; checks: Check[]; whole: boolean };

  const option = (args: string[], name: string): string | undefined => {
    const at = args.indexOf(name);

    return at === -1 ? undefined : args[at + 1];
  };

  const scopeCheck = (body: ReturnType<Check["config"]>): ReturnType<Check["config"]> => {
    const excluded = [...product.elsewhere, ...config.ignore];
    if (!excluded.length) return body;
    const { ignorePatterns = [] } = body as { ignorePatterns?: string[] };

    return { ...body, ignorePatterns: [...ignorePatterns, ...excluded] };
  };

  const check = async (
    args: string[],
    record?: (finding: InspectionFinding) => void,
  ): Promise<number> => {
    const all = architecture.workstreams;
    const layer = option(args, "--layer");
    const workstream = option(args, "--workstream");
    const onlyModule = option(args, "--module");

    if (args.includes("--module") && (!onlyModule || onlyModule.startsWith("--"))) {
      console.error("Name the module with --module <module>.");

      return 2;
    }

    if (onlyModule && args.includes("--whole")) {
      console.error("--whole checks the product and cannot be used with --module.");

      return 2;
    }

    const select = (): Selection | undefined => {
      if (args.includes("--layer")) {
        const found = all
          .flatMap((w) => w.layers)
          .find((l) => l.name === layer);

        if (found) return { layers: [found], checks: [], whole: false };
        const known = all.flatMap((w) => w.layers.map((l) => l.name));
        console.error(`Unknown layer: ${layer}. Layers: ${known.join(", ")}`);

        return undefined;
      }

      if (args.includes("--workstream")) {
        if (all.some((w) => w.id === workstream)) {
          const ws = withUpstream(all, workstream!);

          return {
            layers: ws.flatMap((w) => w.layers),
            checks: ws.flatMap((w) => w.checks),
            whole: false,
          };
        }

        console.error(
          `Unknown workstream: ${workstream}. Workstreams: ${all.map((w) => w.id).join(", ")}`,
        );

        return undefined;
      }

      if (args.includes("--whole"))
        return { layers: [], checks: architecture.checks ?? [], whole: false };

      return {
        layers: all.flatMap((w) => w.layers),
        checks: [
          ...all.flatMap((w) => w.checks),
          ...(architecture.checks ?? []),
        ],
        whole: true,
      };
    };

    const selected = select();
    if (!selected) return 2;
    const { layers, checks, whole } = selected;

    const cache = cacheDir(PROJECT_ROOT);

    const moduleRoots = onlyModule
      ? [config.modules.replace(/\/\*$/, ""), config.acceptance, config.unit, config.integration]
          .map((root) => resolve(PROJECT_ROOT, root, onlyModule) + sep)
      : [];

    const inModule = (file: string): boolean =>
      !onlyModule || moduleRoots.some((root) => resolve(PROJECT_ROOT, file).startsWith(root));

    const compose = (name: string, body: unknown): string => {
      const path = join(cache, name);
      writeFileSync(path, JSON.stringify(body, null, 2));

      return path;
    };

    let failed = false;

    const zones = new Set(
      layers.flatMap((l) => l.fallow?.zones.map((z) => z.name) ?? []),
    );

    if (zones.size) {
      console.log(
        `\n▶ fallow (imports, calls, coverage) in zones ${[...zones].join(", ")}`,
      );

      const { stdout } = runTool("fallow", [
        "architecture",
        "--format",
        "json",
        "--quiet",
        "--config",
        compose("fallow.json", fallowConfig(architecture)),
      ]);

      const r = jsonOf(stdout) as {
        boundary_violations: { from_zone: string; from_path: string; to_zone: string }[];
        boundary_call_violations: { zone: string; path: string }[];
        boundary_coverage_violations: { path: string }[];
      };

      const found = [
        ...r.boundary_violations
          .filter((v) => zones.has(v.from_zone) && inModule(v.from_path))
          .map((v) => `${v.from_path}: ${v.from_zone} → ${v.to_zone}`),
        ...r.boundary_call_violations
          .filter((v) => zones.has(v.zone) && inModule(v.path))
          .map((v) => `${v.path}: forbidden call in ${v.zone}`),
        ...r.boundary_coverage_violations
          .filter((v) => inModule(v.path))
          .map((v) => `${v.path}: [${COVERAGE_RULE}]`),
      ];

      for (const f of found) {
        console.log(`  ${f}`);
        record?.({ file: f.split(": ")[0]!, standard: f.match(/\[([^\]]+)\]/)?.[1] ?? "architecture", tool: "fallow" });
      }

      if (found.length) failed = true;
      else console.log("  no violations");
    }

    const overrides = layers.flatMap(
      (l) => l.oxlint?.(architecture.platform) ?? [],
    );

    const lintFiles = [
      ...new Set(
        overrides
          .flatMap((o) => o.files ?? [])
          .flatMap((p) =>
            globSync(p, { exclude: (f) => f.includes("node_modules") }),
          ),
      ),
    ].filter((f) => /\.tsx?$/.test(f) && inModule(f));

    if (lintFiles.length) {
      console.log(
        `\n▶ oxlint (packages and globals) over ${lintFiles.length} files`,
      );

      const r = runTool(
        "oxlint",
        [
          "-c",
          compose("oxlint.json", oxlintConfig(overrides, PROJECT_ROOT)),
          ...lintFiles,
        ],
        { show: true },
      );

      if (r.status !== 0) {
        failed = true;
        record?.({ file: "", standard: "lint", tool: "oxlint" });
      }
    } else console.log("\n▶ oxlint: no files");

    if (layers.length) {
      console.log("\n▶ archunit (names and shape)");

      const only = {
        ...architecture,
        workstreams: [{ id: "", layers, checks: [], dependsOn: [] }],
      };

      let broken = 0;

      for (const { rules } of archunitRules(only))
        for (const rule of rules) {
          const violations = (await rule.check()).filter((violation) => {
            if (!onlyModule) return true;
            const { cycle } = violation as { cycle?: Array<{ sourceLabel: string }> };

            return cycle
              ? cycle.some(({ sourceLabel }) => inModule(sourceLabel))
              : inModule(fileOf(violation));
          });

          if (!violations.length) continue;
          broken += violations.length;
          console.log(`  ${rule.id} · ${rule.title}`);

          for (const violation of violations) {
            const file = fileOf(violation);
            const { message } = violation as { message?: string };
            console.log(`    ${file}${message ? `: ${message}` : ""}`);
            record?.({ file, standard: rule.id, tool: "archunit" });
          }
        }

      if (broken) failed = true;
      else console.log("  no violations");
    }

    for (const c of onlyModule ? [] : checks) {
      console.log(`\n▶ ${c.id} (whole product)`);

      const r = runTool(
        "fallow",
        [
          ...c.args,
          "--config",
          compose(`${c.id}.json`, scopeCheck(c.config(config))),
        ],
        { show: true },
      );

      if (r.status !== 0) {
        failed = true;
        record?.({ file: "", standard: c.id, tool: "fallow" });
      }
    }

    if (whole && !onlyModule) {
      console.log("\n▶ generated tests are fresh");

      if ((await generate(["--check"])) !== 0) {
        failed = true;
        record?.({ file: "", standard: "generated-tests-are-fresh", tool: "feat2test" });
      }
    }

    return failed ? 1 : 0;
  };

  return { check };
};
