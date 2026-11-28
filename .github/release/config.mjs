import { fileURLToPath } from "node:url";

export default {
  branches: ["main"],
  plugins: [
    ["@semantic-release/commit-analyzer", {
      config: fileURLToPath(import.meta.resolve("conventional-changelog-conventionalcommits")),
    }],
    ["@semantic-release/npm", { npmPublish: false }],
    ["@semantic-release/git", {
      assets: ["package.json"],
      message: "chore(release): ${nextRelease.version} [skip ci]",
    }],
    ["@semantic-release/exec", {
      publishCmd: "bash .github/scripts/publish-release.sh ${nextRelease.gitTag} >&2",
    }],
  ],
};
