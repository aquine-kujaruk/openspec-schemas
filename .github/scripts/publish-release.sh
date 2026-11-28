#!/usr/bin/env bash
set -euo pipefail

source_tag=${1:?Pass a source release tag}
if [[ ! "$source_tag" =~ ^v(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)$ ]]; then
  echo "Expected a source release tag in the form vX.Y.Z" >&2
  exit 1
fi

version=$(node -p 'require("./package.json").version')
source_commit=$(git rev-parse --verify "refs/tags/$source_tag^{commit}")
if [[ "$source_tag" != "v$version" || "$source_commit" != "$(git rev-parse HEAD)" ]]; then
  echo "$source_tag must tag this checkout and match package.json ($version)" >&2
  exit 1
fi

package_tag="packages-$source_tag"
published=$(git ls-remote --tags origin "refs/tags/$package_tag")
if [[ -n "$published" ]]; then
  echo "$package_tag is already published"
  exit 0
fi

pnpm exec factory release --push origin
