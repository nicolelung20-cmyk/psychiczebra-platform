#!/usr/bin/env bash
set -e

# Install dependencies if node_modules is missing
if [ ! -d "node_modules" ]; then
  npm install
fi

exec node server.js
