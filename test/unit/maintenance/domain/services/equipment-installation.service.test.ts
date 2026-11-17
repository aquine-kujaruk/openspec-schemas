import { expect, it } from "vitest";
import { EquipmentInstallationService } from "../../../../../factory/maintenance/domain/services/equipment-installation.service.ts";

const service = new EquipmentInstallationService();
const tarball = "file:.claude/skills/setup/assets/factory-0.14.0.tgz";

it.each([tarball, `${tarball}(@types/node@26.6.5)`])(
  "reads the pinned version when pnpm resolves %s",
  (version) => {
    expect(service.pinnedVersion("factory", { devDependencies: { factory: tarball } }, {
      importers: { ".": { devDependencies: { factory: { version } } } },
      packages: { [`factory@${tarball}`]: { version: "0.14.0" } },
    })).toBe("0.14.0");
  },
);

it("replaces one generated section and preserves project lines on both sides", () => {
  const before = "Own line\n<!-- apm:start -->\nOld rules\n<!-- apm:end -->\nAnother line\n";
  expect(service.withSection(before, ["New rules"])).toBe(
    "Own line\n<!-- apm:start -->\nNew rules\n<!-- apm:end -->\nAnother line\n",
  );
});
