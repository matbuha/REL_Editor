#!/usr/bin/env sh
set -eu
SCRIPT_DIR="$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)"
cd "$SCRIPT_DIR/REL_EDITOR/server"
if [ ! -d node_modules ]; then
  npm install
fi
npm start