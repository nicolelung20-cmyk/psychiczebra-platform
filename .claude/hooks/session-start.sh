#!/bin/bash
set -euo pipefail

# Only run in Claude Code on the web
if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

cd "${CLAUDE_PROJECT_DIR:-$PWD}"

# npm install (not ci) so the container's cached node_modules is reused
npm install --no-audit --no-fund
