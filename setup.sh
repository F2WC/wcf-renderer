#!/usr/bin/env bash
set -euo pipefail

# Determine repository root based on script location
SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" &>/dev/null && pwd)"
ROOT_DIR="$SCRIPT_DIR"
PLAYGROUND_DIR="$ROOT_DIR/playground"

# Colors for nicer output
GREEN='\033[0;32m'
CYAN='\033[0;36m'
RED='\033[0;31m'
NC='\033[0m' # No Color

say() { echo -e "${CYAN}[*]${NC} $*"; }
ok()  { echo -e "${GREEN}[✓]${NC} $*"; }
err() { echo -e "${RED}[x]${NC} $*"; }

run_npm_install() {
  local dir="$1"
  if [[ -f "$dir/package.json" ]]; then
    say "Running npm install in: $dir"
    (cd "$dir" && npm i)
    ok "Installed dependencies in: $dir"
  else
    say "Skipping $dir (no package.json)"
  fi
}

say "Project root: $ROOT_DIR"

# 1) Install dependencies in project root
run_npm_install "$ROOT_DIR"

# 2) Install dependencies in each immediate subfolder of playground
if [[ -d "$PLAYGROUND_DIR" ]]; then
  say "Processing playground sub-projects in: $PLAYGROUND_DIR"
  shopt -s nullglob
  for subdir in "$PLAYGROUND_DIR"/*; do
    if [[ -d "$subdir" ]]; then
      run_npm_install "$subdir"
    fi
  done
  shopt -u nullglob
else
  say "No playground directory found at $PLAYGROUND_DIR — skipping."
fi

ok "Setup complete."
echo
cat <<'EOT'
You can now start the project with Docker.

Common commands:
  - docker compose up --build
  - or: docker-compose up --build (on older Docker setups)
EOT
