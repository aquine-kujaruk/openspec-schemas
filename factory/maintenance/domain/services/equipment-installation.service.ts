export const SECTION = { start: "<!-- apm:start -->", end: "<!-- apm:end -->" };

type PinLock = {
  importers?: Record<string, { devDependencies?: Record<string, { version: string }> }>;
  packages?: Record<string, { version?: string }>;
};

export class EquipmentInstallationService {
  pinnedVersion(command: string, manifest: { devDependencies?: Record<string, string> }, lock: PinLock): string | undefined {
    if (!manifest.devDependencies?.[command]) return undefined;
    // pnpm can append the peers it resolved to a tarball name.
    const resolved = lock.importers?.["."]?.devDependencies?.[command]?.version?.replace(/\(.*\)$/, "");
    return resolved ? (lock.packages?.[`${command}@${resolved}`]?.version ?? resolved) : undefined;
  }

  withSection(own: string | undefined, instructions: string[]): string {
    const section = `${SECTION.start}\n${instructions.join("\n\n")}\n${SECTION.end}`;
    const before = own ?? "";
    const start = before.indexOf(SECTION.start);
    const end = before.indexOf(SECTION.end);
    if (start !== -1 && end > start) {
      return before.slice(0, start) + section + before.slice(end + SECTION.end.length);
    }
    return `${before.trim() ? `${before.trimEnd()}\n\n` : ""}${section}\n`;
  }
}
