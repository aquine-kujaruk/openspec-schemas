#!/bin/sh
# Installs a package of openspec-schemas in the project of the current folder, in one command:
#
#   curl -fsSL https://raw.githubusercontent.com/aquine-kujaruk/openspec-schemas/main/install.sh | sh -s -- backend
#
# Usage: install.sh <package> [--version <x.y.z>] [--agents <agent,agent>]
#
# It checks the machine, installs the agent package manager when it is missing, installs the
# package at the highest released version (or the one named) for the agents named (every agent
# the package names by default), pins the command and runs setup.
#
# FACTORY_REPOSITORY overrides the git repository releases are read from.
# APM_INSTALLER overrides the command that installs the agent package manager; it gets `@v<version>`.
set -eu

OWNER_REPOSITORY="aquine-kujaruk/openspec-schemas"
REPOSITORY="${FACTORY_REPOSITORY:-https://github.com/$OWNER_REPOSITORY.git}"
NODE_NEEDED="22.18"

fail() { printf 'install: %s\n' "$*" >&2; exit 1; }
say() { printf '%s\n' "$*"; }

package=""
version=""
agents=""
while [ $# -gt 0 ]; do
  case "$1" in
    --version) [ $# -ge 2 ] || fail "--version needs a version"; version="$2"; shift 2 ;;
    --agents) [ $# -ge 2 ] || fail "--agents needs a list such as claude,codex"; agents="$2"; shift 2 ;;
    -h|--help) sed -n '2,15p' "$0" 2>/dev/null || true; exit 0 ;;
    -*) fail "unknown option $1" ;;
    *) [ -z "$package" ] || fail "name one package, not $package and $1"; package="$1"; shift ;;
  esac
done
[ -n "$package" ] || fail "name the package to install: backend, frontend or fullstack"

# The machine: what only the person installs is named and nothing is installed.
missing=""
command -v git >/dev/null 2>&1 || missing="$missing git"
if command -v node >/dev/null 2>&1; then
  have=$(node --version 2>/dev/null | sed 's/^v//')
  lowest=$(printf '%s\n%s\n' "$NODE_NEEDED" "$have" | sort -V | head -n 1)
  [ "$lowest" = "$NODE_NEEDED" ] || missing="$missing Node $NODE_NEEDED (found $have)"
else
  missing="$missing Node $NODE_NEEDED"
fi
command -v pnpm >/dev/null 2>&1 || missing="$missing pnpm"
[ -z "$missing" ] || fail "this machine lacks:$missing. Install it and run the installer again."
[ -f package.json ] || fail "run it in the root of a project with a package.json (pnpm init makes one)"

# The release: the highest one unless one is named.
released=$(git ls-remote --tags --refs "$REPOSITORY" 'packages-v*' 2>/dev/null \
  | sed 's|.*refs/tags/packages-v||' | sort -V) || true
[ -n "$released" ] || fail "no release is published at $REPOSITORY"
if [ -z "$version" ]; then
  version=$(printf '%s\n' "$released" | tail -n 1)
elif ! printf '%s\n' "$released" | grep -qx "$version"; then
  fail "version $version was never released; released: $(printf '%s' "$released" | tr '\n' ' ')"
fi
ref="packages-v$version"

work=$(mktemp -d)
trap 'rm -rf "$work"' EXIT
git clone --quiet --depth 1 --branch "$ref" "$REPOSITORY" "$work/release" 2>/dev/null \
  || fail "could not read $ref from $REPOSITORY"
manifest="$work/release/$package/.apm/skills/setup/assets/manifest.json"
[ -f "$manifest" ] || fail "no package is called $package; packages: $(ls "$work/release" | tr '\n' ' ')"
field() { node -e 'const m=require(process.argv[1]); const v=process.argv[2].split(".").reduce((o,k)=>o?.[k],m); console.log(Array.isArray(v)?v.join(","):v ?? "")' "$manifest" "$1"; }
named_agents=$(field agents)
apm_version=$(field packageManager.version)
tarball=$(field command)

# The agents: the package's own unless some are named, and only those it names.
[ -n "$agents" ] || agents="$named_agents"
for agent in $(printf '%s' "$agents" | tr ',' ' '); do
  case ",$named_agents," in
    *",$agent,"*) ;;
    *) fail "$package does not install for $agent; it installs for $named_agents" ;;
  esac
done

# The agent package manager, at the version the package names, when it is missing.
PATH="$HOME/.local/bin:$PATH"
if ! command -v apm >/dev/null 2>&1; then
  say "installing the agent package manager $apm_version"
  if [ -n "${APM_INSTALLER:-}" ]; then
    $APM_INSTALLER "@v$apm_version"
  else
    command -v curl >/dev/null 2>&1 || fail "this machine lacks: curl, to install the agent package manager"
    curl -sSL https://aka.ms/apm-unix | sh -s -- "@v$apm_version"
  fi
  command -v apm >/dev/null 2>&1 || fail "the agent package manager did not install; see https://github.com/microsoft/apm"
fi

say "installing $package $version for $agents"
apm install "$OWNER_REPOSITORY/$package#$ref" --target "$agents"

# The command, from whichever agent folder the setup skill landed in.
found=""
for dir in .claude/skills .agents/skills .codex/skills .github/skills; do
  if [ -f "$dir/setup/assets/$tarball" ]; then found="$dir/setup/assets/$tarball"; break; fi
done
[ -n "$found" ] || fail "the package installed no setup skill holding $tarball"
pnpm add -D "./$found"
pnpm exec factory doctor --fix || true

say ""
say "$package $version is installed. What setup still reports:"
pnpm exec factory doctor || true
say ""
say "Next: open your agent in this folder and say what you want to change."
